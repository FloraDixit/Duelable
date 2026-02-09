import { useState, useEffect, useCallback, useRef } from "react";

// ─── DATA ───────────────────────────────────────────────────────────────────
const USERS = [
  { id: "me", name: "Flora", avatar: "🦈", streak: 12, completion: 87, bettingAcc: 72, engagement: 91 },
  { id: "u1", name: "Aritro", avatar: "🚀", streak: 9, completion: 82, bettingAcc: 68, engagement: 85 },
  { id: "u2", name: "Maya", avatar: "🎯", streak: 15, completion: 94, bettingAcc: 75, engagement: 78 },
  { id: "u3", name: "Jordan", avatar: "⚡", streak: 6, completion: 71, bettingAcc: 80, engagement: 69 },
  { id: "u4", name: "Sam", avatar: "🔥", streak: 3, completion: 65, bettingAcc: 62, engagement: 88 },
];

const GOALS_TEMPLATES = [
  { icon: "🏋️", label: "Gym", goal: "Hit the gym", freq: 4 },
  { icon: "📚", label: "Read", goal: "Read 30 min", freq: 5 },
  { icon: "🎸", label: "Music", goal: "Practice guitar", freq: 3 },
  { icon: "💻", label: "Code", goal: "Side project work", freq: 5 },
  { icon: "🧘", label: "Meditate", goal: "Meditate 10 min", freq: 7 },
  { icon: "✍️", label: "Write", goal: "Journal entry", freq: 4 },
];

const INITIAL_GOALS = [
  { id: "g1", userId: "me", text: "Hit the gym", freq: 4, completed: 2, icon: "🏋️" },
  { id: "g2", userId: "me", text: "Read 30 min", freq: 5, completed: 3, icon: "📚" },
];

const MEMBER_GOALS = [
  { userId: "u1", text: "LeetCode problems", freq: 5, completed: 3, icon: "💻" },
  { userId: "u2", text: "Morning run", freq: 6, completed: 5, icon: "🏃" },
  { userId: "u3", text: "Cook dinner", freq: 4, completed: 2, icon: "🍳" },
  { userId: "u4", text: "Practice piano", freq: 3, completed: 1, icon: "🎹" },
];

const INITIAL_FEED = [
  { id: "f1", userId: "u2", goalText: "Morning run", time: "2 hours ago", caption: "6am grind never stops 💪", reactions: { "🔥": 3, "💪": 2 }, comments: [{ user: "Aritro", text: "Beast mode!" }], hasPhoto: true },
  { id: "f2", userId: "u1", goalText: "LeetCode problems", time: "4 hours ago", caption: "Hard problem #347 done", reactions: { "🔥": 1, "🧠": 2 }, comments: [], hasPhoto: true },
  { id: "f3", userId: "me", goalText: "Hit the gym", time: "Yesterday", caption: "Leg day complete", reactions: { "💪": 4, "🔥": 2 }, comments: [{ user: "Maya", text: "Get it!!" }, { user: "Sam", text: "no way you actually went 😂" }], hasPhoto: true },
  { id: "f4", userId: "u4", goalText: "Practice piano", time: "Yesterday", caption: "Learning Clair de Lune", reactions: { "🎵": 3 }, comments: [], hasPhoto: true },
];

const REACTIONS = ["🔥", "💪", "🧠", "😂", "🧢"];

const CONSEQUENCE_OPTIONS = [
  "Buy the group boba 🧋",
  "Post an embarrassing selfie 🤳",
  "Do 50 push-ups on video 💪",
  "Sing a song on FaceTime 🎤",
  "Wear a silly hat all day 🎩",
];

// ─── HELPERS ────────────────────────────────────────────────────────────────
function calcScore(u) {
  return Math.round(u.completion * 0.4 + u.streak * 1.5 * 0.2 * 10 + u.bettingAcc * 0.25 + u.engagement * 0.15);
}

function getRankedUsers(users) {
  return [...users].sort((a, b) => calcScore(b) - calcScore(a));
}

// ─── ANIMATED NUMBER ────────────────────────────────────────────────────────
function AnimNum({ value, suffix = "" }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 600;
    const startTime = Date.now();
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [value]);
  return <span>{display}{suffix}</span>;
}

// ─── CONFETTI ───────────────────────────────────────────────────────────────
function Confetti({ active }) {
  if (!active) return null;
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    color: ["#3B82F6", "#F59E0B", "#10B981", "#EF4444", "#8B5CF6", "#FFD700"][i % 6],
    size: 4 + Math.random() * 6,
  }));
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 9999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: "-10px",
          width: p.size, height: p.size, borderRadius: p.size > 7 ? "50%" : "1px",
          background: p.color,
          animation: `confettiFall 1.5s ${p.delay}s ease-out forwards`,
        }} />
      ))}
    </div>
  );
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function Duelable() {
  const [tab, setTab] = useState("feed");
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [feed, setFeed] = useState(INITIAL_FEED);
  const [bets, setBets] = useState({});
  const [betBudget, setBetBudget] = useState(100);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showLockIn, setShowLockIn] = useState(false);
  const [showBetSheet, setShowBetSheet] = useState(null);
  const [showConsequences, setShowConsequences] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [expandedComments, setExpandedComments] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [proofGoal, setProofGoal] = useState(null);
  const [proofCaption, setProofCaption] = useState("");
  const [newGoalText, setNewGoalText] = useState("");
  const [newGoalFreq, setNewGoalFreq] = useState(4);
  const [newGoalIcon, setNewGoalIcon] = useState("🎯");
  const [consequenceVote, setConsequenceVote] = useState(null);
  const [toast, setToast] = useState(null);

  const daysLeft = 4;
  const currentWeek = "Week of Feb 3 – Feb 9";

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const fireConfetti = useCallback(() => {
    setConfetti(true);
    setTimeout(() => setConfetti(false), 2000);
  }, []);

  // ─── PROOF SUBMISSION ───────────────────────────────────────────────────
  const submitProof = () => {
    if (!proofGoal) return;
    const goal = goals.find(g => g.id === proofGoal);
    if (!goal) return;
    const newPost = {
      id: `f${Date.now()}`,
      userId: "me",
      goalText: goal.text,
      time: "Just now",
      caption: proofCaption || "Proof submitted! ✅",
      reactions: {},
      comments: [],
      hasPhoto: true,
    };
    setFeed(prev => [newPost, ...prev]);
    setGoals(prev => prev.map(g => g.id === proofGoal ? { ...g, completed: Math.min(g.completed + 1, g.freq) } : g));
    setShowProofModal(false);
    setProofGoal(null);
    setProofCaption("");
    fireConfetti();
    showToast("Proof posted! 🎉");
  };

  // ─── ADD GOAL ─────────────────────────────────────────────────────────────
  const addGoal = () => {
    if (!newGoalText.trim()) return;
    const newG = {
      id: `g${Date.now()}`,
      userId: "me",
      text: newGoalText,
      freq: newGoalFreq,
      completed: 0,
      icon: newGoalIcon,
    };
    setGoals(prev => [...prev, newG]);
    setShowGoalModal(false);
    setNewGoalText("");
    setNewGoalFreq(4);
    setNewGoalIcon("🎯");
    showToast("Goal locked in! 🔒");
  };

  // ─── PLACE BET ────────────────────────────────────────────────────────────
  const placeBet = (userId, prediction, points) => {
    if (points > betBudget) return;
    setBets(prev => ({ ...prev, [userId]: { prediction, points } }));
    setBetBudget(prev => prev - points);
    setShowBetSheet(null);
    showToast(`Bet placed on ${USERS.find(u => u.id === userId)?.name}! 🎲`);
  };

  // ─── REACT TO POST ────────────────────────────────────────────────────────
  const reactToPost = (postId, emoji) => {
    setFeed(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const updated = { ...p, reactions: { ...p.reactions } };
      updated.reactions[emoji] = (updated.reactions[emoji] || 0) + 1;
      return updated;
    }));
  };

  const addComment = (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    setFeed(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return { ...p, comments: [...p.comments, { user: "Flora", text }] };
    }));
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  const ranked = getRankedUsers(USERS);

  // ─── STYLES ───────────────────────────────────────────────────────────────
  const styles = {
    app: {
      fontFamily: "'DM Sans', 'Outfit', system-ui, sans-serif",
      background: "#0A0E1A",
      color: "#E8ECF4",
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    },
    header: {
      padding: "16px 20px 12px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      background: "linear-gradient(180deg, #0F1528 0%, #0A0E1A 100%)",
      position: "sticky",
      top: 0,
      zIndex: 100,
    },
    logo: {
      fontSize: 22,
      fontWeight: 800,
      letterSpacing: "-0.5px",
      background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    },
    leagueBadge: {
      fontSize: 11,
      padding: "4px 10px",
      borderRadius: 20,
      background: "rgba(59,130,246,0.15)",
      color: "#60A5FA",
      fontWeight: 600,
      letterSpacing: "0.3px",
    },
    content: {
      paddingBottom: 90,
      minHeight: "calc(100vh - 60px)",
    },
    tabBar: {
      position: "fixed",
      bottom: 0,
      left: "50%",
      transform: "translateX(-50%)",
      width: "100%",
      maxWidth: 430,
      display: "flex",
      background: "rgba(10,14,26,0.95)",
      backdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.06)",
      zIndex: 100,
      padding: "6px 0 env(safe-area-inset-bottom, 8px)",
    },
    tabBtn: (active) => ({
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 3,
      padding: "8px 0",
      background: "none",
      border: "none",
      color: active ? "#3B82F6" : "#4B5575",
      fontSize: 10,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      transition: "all 0.2s",
      letterSpacing: "0.3px",
    }),
    card: {
      background: "linear-gradient(145deg, #131A2E 0%, #0F1528 100%)",
      borderRadius: 16,
      margin: "12px 16px",
      border: "1px solid rgba(255,255,255,0.06)",
      overflow: "hidden",
    },
    btn: (variant = "primary") => ({
      padding: variant === "sm" ? "6px 14px" : "12px 24px",
      borderRadius: variant === "sm" ? 8 : 12,
      border: "none",
      fontWeight: 700,
      fontSize: variant === "sm" ? 12 : 14,
      cursor: "pointer",
      transition: "all 0.2s",
      fontFamily: "inherit",
      ...(variant === "primary" || variant === "sm" ? {
        background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
        color: "#fff",
        boxShadow: "0 4px 15px rgba(37,99,235,0.3)",
      } : variant === "ghost" ? {
        background: "rgba(255,255,255,0.05)",
        color: "#94A3B8",
        border: "1px solid rgba(255,255,255,0.08)",
      } : {
        background: "rgba(59,130,246,0.1)",
        color: "#60A5FA",
      }),
    }),
    modal: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(8px)",
      zIndex: 200,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
    },
    modalContent: {
      background: "linear-gradient(180deg, #1A2240 0%, #131A2E 100%)",
      borderRadius: "24px 24px 0 0",
      padding: "24px 20px 36px",
      width: "100%",
      maxWidth: 430,
      maxHeight: "85vh",
      overflowY: "auto",
      border: "1px solid rgba(255,255,255,0.08)",
      borderBottom: "none",
    },
    input: {
      width: "100%",
      padding: "12px 16px",
      borderRadius: 12,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.05)",
      color: "#E8ECF4",
      fontSize: 14,
      fontFamily: "inherit",
      outline: "none",
      boxSizing: "border-box",
    },
  };

  // ─── FEED TAB ─────────────────────────────────────────────────────────────
  const FeedTab = () => (
    <div>
      {/* Your Week Card */}
      <div style={styles.card}>
        <div style={{ padding: "18px 18px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>Your Week</span>
          <span style={{ fontSize: 12, color: "#F59E0B", fontWeight: 600 }}>⏱ {daysLeft} days left</span>
        </div>
        <div style={{ padding: "8px 18px 16px" }}>
          {goals.map(g => (
            <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{g.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{g.text}</span>
                  <span style={{ fontSize: 12, color: g.completed >= g.freq ? "#10B981" : "#60A5FA", fontWeight: 700 }}>
                    {g.completed}/{g.freq}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    borderRadius: 3,
                    width: `${Math.min((g.completed / g.freq) * 100, 100)}%`,
                    background: g.completed >= g.freq
                      ? "linear-gradient(90deg, #10B981, #34D399)"
                      : "linear-gradient(90deg, #2563EB, #3B82F6)",
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 18px 16px", display: "flex", gap: 8 }}>
          <button style={{ ...styles.btn("primary"), flex: 1 }} onClick={() => setShowProofModal(true)}>
            📸 Post Proof
          </button>
          <button style={{ ...styles.btn("ghost"), padding: "12px 16px" }} onClick={() => setShowGoalModal(true)}>
            +
          </button>
        </div>
      </div>

      {/* Streak Banner */}
      <div style={{
        margin: "0 16px 4px",
        padding: "12px 16px",
        borderRadius: 12,
        background: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(245,158,11,0.04) 100%)",
        border: "1px solid rgba(245,158,11,0.15)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>🔥</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F59E0B" }}>12 Week Streak!</div>
          <div style={{ fontSize: 11, color: "#94A3B8" }}>Longest in your league — keep it going</div>
        </div>
      </div>

      {/* Activity Feed */}
      <div style={{ padding: "12px 16px 4px" }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>League Activity</span>
      </div>
      {feed.map(post => {
        const user = USERS.find(u => u.id === post.userId);
        const isExpanded = expandedComments[post.id];
        return (
          <div key={post.id} style={styles.card}>
            {/* Post Header */}
            <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 12,
                background: "linear-gradient(135deg, #1E293B, #334155)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
              }}>
                {user?.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{user?.name}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>Completed: {post.goalText} · {post.time}</div>
              </div>
              <span style={{ fontSize: 10, color: "#10B981", fontWeight: 600, background: "rgba(16,185,129,0.1)", padding: "3px 8px", borderRadius: 6 }}>✓ Verified</span>
            </div>

            {/* Photo placeholder */}
            <div style={{
              margin: "12px 16px",
              height: 180,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${
                post.userId === "u2" ? "#1a2a1a, #0f1f0f" :
                post.userId === "u1" ? "#1a1a2a, #0f0f1f" :
                post.userId === "u4" ? "#2a1a2a, #1f0f1f" :
                "#1a2232, #0f1620"
              })`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", inset: 0, opacity: 0.03,
                backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }} />
              <span style={{ filter: "grayscale(0.2)" }}>
                {post.userId === "u2" ? "🏃‍♀️" : post.userId === "u1" ? "💻" : post.userId === "u4" ? "🎹" : "🏋️"}
              </span>
            </div>

            {/* Caption */}
            {post.caption && (
              <div style={{ padding: "0 16px 8px", fontSize: 13, color: "#CBD5E1" }}>
                <span style={{ fontWeight: 700, marginRight: 6 }}>{user?.name}</span>
                {post.caption}
              </div>
            )}

            {/* Reactions */}
            <div style={{ padding: "4px 16px 8px", display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              {Object.entries(post.reactions).map(([emoji, count]) => (
                <span key={emoji} style={{
                  padding: "4px 8px", borderRadius: 20, fontSize: 12,
                  background: "rgba(255,255,255,0.05)", cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  {emoji} {count}
                </span>
              ))}
              <div style={{ display: "flex", gap: 2, marginLeft: 4 }}>
                {REACTIONS.map(r => (
                  <button key={r} onClick={() => reactToPost(post.id, r)} style={{
                    background: "none", border: "none", fontSize: 14, cursor: "pointer",
                    padding: "2px 3px", borderRadius: 6, transition: "all 0.15s",
                  }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div style={{ padding: "0 16px 12px" }}>
              {post.comments.length > 0 && (
                <button onClick={() => setExpandedComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                  style={{ background: "none", border: "none", color: "#64748B", fontSize: 12, cursor: "pointer", padding: 0, marginBottom: 6, fontFamily: "inherit" }}>
                  {isExpanded ? "Hide comments" : `View ${post.comments.length} comment${post.comments.length > 1 ? "s" : ""}`}
                </button>
              )}
              {isExpanded && post.comments.map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: "#94A3B8", marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: "#CBD5E1" }}>{c.user}</span> {c.text}
                </div>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                <input
                  placeholder="Add a comment..."
                  value={commentInputs[post.id] || ""}
                  onChange={e => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                  onKeyDown={e => e.key === "Enter" && addComment(post.id)}
                  style={{ ...styles.input, padding: "8px 12px", fontSize: 12, flex: 1 }}
                />
                <button onClick={() => addComment(post.id)} style={{ ...styles.btn("sm"), padding: "8px 12px" }}>↑</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── LEADERBOARD TAB ──────────────────────────────────────────────────────
  const LeaderboardTab = () => {
    const podium = ranked.slice(0, 3);
    const podiumOrder = [podium[1], podium[0], podium[2]];
    const podiumHeights = [100, 130, 80];

    return (
      <div>
        {/* Week info */}
        <div style={{ textAlign: "center", padding: "16px 16px 4px" }}>
          <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{currentWeek}</div>
          <div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, letterSpacing: "-0.5px" }}>League Standings</div>
        </div>

        {/* Podium */}
        <div style={{
          display: "flex", justifyContent: "center", alignItems: "flex-end",
          gap: 8, padding: "20px 24px 0", height: 200,
        }}>
          {podiumOrder.map((user, i) => user && (
            <div key={user.id} style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              width: 100, animation: `slideUp 0.5s ${i * 0.1}s ease-out both`,
            }}>
              <div style={{
                fontSize: 28,
                width: 48, height: 48, borderRadius: 16,
                background: i === 1 ? "linear-gradient(135deg, #F59E0B, #D97706)" : "linear-gradient(135deg, #1E293B, #334155)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: i === 1 ? "0 4px 20px rgba(245,158,11,0.3)" : "none",
                border: i === 1 ? "2px solid #F59E0B" : i === 0 ? "2px solid #94A3B8" : "2px solid #B45309",
                marginBottom: 6,
              }}>
                {user.avatar}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{user.name}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 8 }}><AnimNum value={calcScore(user)} /> pts</div>
              <div style={{
                width: "100%",
                height: podiumHeights[i],
                borderRadius: "12px 12px 0 0",
                background: i === 1
                  ? "linear-gradient(180deg, rgba(245,158,11,0.3) 0%, rgba(245,158,11,0.05) 100%)"
                  : i === 0
                  ? "linear-gradient(180deg, rgba(148,163,184,0.2) 0%, rgba(148,163,184,0.05) 100%)"
                  : "linear-gradient(180deg, rgba(180,83,9,0.2) 0%, rgba(180,83,9,0.05) 100%)",
                border: `1px solid ${i === 1 ? "rgba(245,158,11,0.2)" : i === 0 ? "rgba(148,163,184,0.15)" : "rgba(180,83,9,0.15)"}`,
                borderBottom: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: i === 1 ? "#F59E0B" : i === 0 ? "#94A3B8" : "#B45309",
              }}>
                {i === 1 ? "🥇" : i === 0 ? "🥈" : "🥉"}
              </div>
            </div>
          ))}
        </div>

        {/* Full standings */}
        <div style={styles.card}>
          <div style={{ padding: "16px 16px 8px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>Full Standings</span>
          </div>
          {ranked.map((user, i) => (
            <div key={user.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              background: user.id === "me" ? "rgba(59,130,246,0.06)" : "transparent",
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 800,
                background: i === 0 ? "rgba(245,158,11,0.15)" : i === ranked.length - 1 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                color: i === 0 ? "#F59E0B" : i === ranked.length - 1 ? "#EF4444" : "#64748B",
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 20 }}>{user.avatar}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{user.name} {user.id === "me" && <span style={{ fontSize: 10, color: "#3B82F6" }}>(you)</span>}</div>
                <div style={{ fontSize: 11, color: "#64748B" }}>
                  🔥{user.streak}w · {user.completion}% done · {user.bettingAcc}% bets
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? "#F59E0B" : "#E8ECF4" }}>
                  <AnimNum value={calcScore(user)} />
                </div>
                <div style={{ fontSize: 10, color: "#64748B" }}>pts</div>
              </div>
              {user.id !== "me" && !bets[user.id] && (
                <button onClick={() => setShowBetSheet(user.id)} style={{
                  ...styles.btn("sm"), padding: "6px 10px", fontSize: 11,
                }}>
                  Bet
                </button>
              )}
              {bets[user.id] && (
                <span style={{
                  fontSize: 10, padding: "4px 8px", borderRadius: 6,
                  background: bets[user.id].prediction === "yes" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                  color: bets[user.id].prediction === "yes" ? "#10B981" : "#EF4444",
                  fontWeight: 700,
                }}>
                  {bets[user.id].prediction === "yes" ? "✓" : "✗"} {bets[user.id].points}pts
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Betting Budget */}
        <div style={{ ...styles.card, padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Bet Budget</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#3B82F6", marginTop: 4 }}><AnimNum value={betBudget} /> <span style={{ fontSize: 14, color: "#64748B" }}>pts left</span></div>
            </div>
            <div style={{ fontSize: 11, color: "#64748B", textAlign: "right" }}>
              {Object.keys(bets).length}/4 bets placed<br />
              Resets Sunday
            </div>
          </div>
        </div>

        {/* Consequence Zone */}
        <div style={{
          ...styles.card,
          border: "1px solid rgba(239,68,68,0.15)",
          background: "linear-gradient(145deg, rgba(239,68,68,0.06) 0%, #0F1528 100%)",
        }}>
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#EF4444", textTransform: "uppercase", letterSpacing: "0.5px" }}>⚠️ Consequence Zone</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 4 }}>
                  Bottom ranked at month-end faces the group's punishment
                </div>
              </div>
              <button onClick={() => setShowConsequences(true)} style={{ ...styles.btn("sm"), background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                Vote
              </button>
            </div>
            <div style={{ marginTop: 10, fontSize: 12, color: "#F87171", fontWeight: 600 }}>
              Current last place: {ranked[ranked.length - 1]?.avatar} {ranked[ranked.length - 1]?.name}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── PROFILE TAB ──────────────────────────────────────────────────────────
  const ProfileTab = () => {
    const me = USERS.find(u => u.id === "me");
    const myRank = ranked.findIndex(u => u.id === "me") + 1;
    const stats = [
      { label: "Completion", value: `${me.completion}%`, color: "#3B82F6" },
      { label: "Streak", value: `${me.streak}w`, color: "#F59E0B" },
      { label: "Bet Accuracy", value: `${me.bettingAcc}%`, color: "#10B981" },
      { label: "League Rank", value: `#${myRank}`, color: "#8B5CF6" },
    ];

    const weeklyData = [65, 78, 82, 75, 90, 87, 85, 92, 88, 87];

    return (
      <div>
        {/* Profile Header */}
        <div style={{ textAlign: "center", padding: "24px 16px 16px" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 24, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #2563EB, #3B82F6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, boxShadow: "0 8px 30px rgba(37,99,235,0.3)",
          }}>
            {me.avatar}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>{me.name}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>Member since Jan 2025 · 🔥 12 week streak</div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "0 16px" }}>
          {stats.map(s => (
            <div key={s.label} style={{
              ...styles.card,
              margin: 0,
              padding: "16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly Trend */}
        <div style={styles.card}>
          <div style={{ padding: "16px 16px 8px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>Weekly Trend</span>
          </div>
          <div style={{ padding: "0 16px 16px", display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
            {weeklyData.map((val, i) => (
              <div key={i} style={{
                flex: 1,
                height: `${val * 0.8}%`,
                borderRadius: "4px 4px 0 0",
                background: i === weeklyData.length - 1
                  ? "linear-gradient(180deg, #3B82F6, #2563EB)"
                  : "rgba(59,130,246,0.2)",
                transition: "height 0.5s ease",
                position: "relative",
              }}>
                {i === weeklyData.length - 1 && (
                  <div style={{
                    position: "absolute", top: -18, left: "50%", transform: "translateX(-50%)",
                    fontSize: 10, fontWeight: 700, color: "#3B82F6", whiteSpace: "nowrap",
                  }}>
                    {val}%
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ padding: "0 16px 12px", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, color: "#475569" }}>10 weeks ago</span>
            <span style={{ fontSize: 10, color: "#475569" }}>This week</span>
          </div>
        </div>

        {/* My Leagues */}
        <div style={styles.card}>
          <div style={{ padding: "16px 16px 8px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>My Leagues</span>
          </div>
          {[
            { name: "Grind Squad 💪", members: 5, rank: myRank, active: true },
            { name: "Book Club 📚", members: 4, rank: 2, active: false },
          ].map((league, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {league.name}
                  {league.active && <span style={{ fontSize: 9, color: "#10B981", marginLeft: 6, fontWeight: 600 }}>● ACTIVE</span>}
                </div>
                <div style={{ fontSize: 11, color: "#64748B" }}>{league.members} members · Rank #{league.rank}</div>
              </div>
              <span style={{ fontSize: 12, color: "#64748B" }}>→</span>
            </div>
          ))}
          <div style={{ padding: "12px 16px" }}>
            <button style={{ ...styles.btn("ghost"), width: "100%" }} onClick={() => showToast("League creation coming soon!")}>
              + Create New League
            </button>
          </div>
        </div>

        {/* Settings */}
        <div style={styles.card}>
          <div style={{ padding: "16px 16px 8px" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.5px", textTransform: "uppercase" }}>Settings</span>
          </div>
          {["Notification Preferences", "Goal History", "Account Settings", "Invite Friends"].map((item, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "14px 16px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              cursor: "pointer",
            }}>
              <span style={{ fontSize: 14 }}>{item}</span>
              <span style={{ color: "#475569" }}>→</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={styles.app}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 0; }
        input::placeholder { color: #475569; }
        @keyframes confettiFall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>

      <Confetti active={confetti} />

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "rgba(16,185,129,0.95)", color: "#fff", padding: "10px 20px",
          borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 300,
          animation: "fadeIn 0.3s ease", boxShadow: "0 4px 20px rgba(16,185,129,0.3)",
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>Duelable</span>
        <span style={styles.leagueBadge}>🏆 Grind Squad</span>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {tab === "feed" && <FeedTab />}
        {tab === "leaderboard" && <LeaderboardTab />}
        {tab === "profile" && <ProfileTab />}
      </div>

      {/* Tab Bar */}
      <div style={styles.tabBar}>
        {[
          { id: "feed", icon: "🏠", label: "Feed" },
          { id: "leaderboard", icon: "🏆", label: "Board" },
          { id: "profile", icon: "👤", label: "Profile" },
        ].map(t => (
          <button key={t.id} style={styles.tabBtn(tab === t.id)} onClick={() => setTab(t.id)}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ─── PROOF MODAL ─────────────────────────────────────────────────── */}
      {showProofModal && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setShowProofModal(false)}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>📸 Post Proof</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Upload evidence of your completed goal</div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Which goal?</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {goals.map(g => (
                <button key={g.id} onClick={() => setProofGoal(g.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "12px 14px",
                  borderRadius: 12, border: proofGoal === g.id ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.08)",
                  background: proofGoal === g.id ? "rgba(59,130,246,0.1)" : "rgba(255,255,255,0.03)",
                  color: "#E8ECF4", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                }}>
                  <span style={{ fontSize: 20 }}>{g.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{g.text}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>{g.completed}/{g.freq} this week</div>
                  </div>
                  {proofGoal === g.id && <span style={{ color: "#3B82F6" }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Simulated photo */}
            <div style={{
              height: 160, borderRadius: 12, marginBottom: 16,
              border: "2px dashed rgba(255,255,255,0.1)",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.02)", cursor: "pointer",
            }} onClick={() => showToast("Camera would open here 📷")}>
              <span style={{ fontSize: 32, marginBottom: 8 }}>📷</span>
              <span style={{ fontSize: 13, color: "#64748B" }}>Tap to take a photo</span>
              <span style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>Auto-timestamped</span>
            </div>

            <input
              placeholder="Add a caption (optional)"
              value={proofCaption}
              onChange={e => setProofCaption(e.target.value)}
              style={{ ...styles.input, marginBottom: 16 }}
            />

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowProofModal(false)} style={{ ...styles.btn("ghost"), flex: 1 }}>Cancel</button>
              <button onClick={submitProof} disabled={!proofGoal} style={{
                ...styles.btn("primary"), flex: 2,
                opacity: proofGoal ? 1 : 0.4,
              }}>
                Post Proof ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── GOAL MODAL ──────────────────────────────────────────────────── */}
      {showGoalModal && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setShowGoalModal(false)}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🎯 Add Goal</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>Set a new weekly goal — it locks after confirmation</div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Quick Templates</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
              {GOALS_TEMPLATES.map(t => (
                <button key={t.label} onClick={() => { setNewGoalText(t.goal); setNewGoalFreq(t.freq); setNewGoalIcon(t.icon); }}
                  style={{
                    padding: "8px 14px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                    background: newGoalText === t.goal ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
                    border: newGoalText === t.goal ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    color: newGoalText === t.goal ? "#60A5FA" : "#94A3B8",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>Custom Goal</div>
            <input
              placeholder="e.g., Practice guitar"
              value={newGoalText}
              onChange={e => setNewGoalText(e.target.value)}
              style={{ ...styles.input, marginBottom: 16 }}
            />

            <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 8 }}>
              Days per week: <span style={{ color: "#3B82F6" }}>{newGoalFreq}</span>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <button key={n} onClick={() => setNewGoalFreq(n)} style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: newGoalFreq === n ? "linear-gradient(135deg, #2563EB, #3B82F6)" : "rgba(255,255,255,0.05)",
                  border: newGoalFreq === n ? "none" : "1px solid rgba(255,255,255,0.08)",
                  color: newGoalFreq === n ? "#fff" : "#94A3B8",
                  fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {n}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowGoalModal(false)} style={{ ...styles.btn("ghost"), flex: 1 }}>Cancel</button>
              <button onClick={addGoal} disabled={!newGoalText.trim()} style={{
                ...styles.btn("primary"), flex: 2,
                opacity: newGoalText.trim() ? 1 : 0.4,
              }}>
                Lock In 🔒
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── BET SHEET ───────────────────────────────────────────────────── */}
      {showBetSheet && (() => {
        const target = USERS.find(u => u.id === showBetSheet);
        const targetGoal = MEMBER_GOALS.find(g => g.userId === showBetSheet);
        const [betPts, setBetPtsLocal] = [20, () => {}]; // simplified
        return (
          <div style={styles.modal} onClick={e => e.target === e.currentTarget && setShowBetSheet(null)}>
            <div style={styles.modalContent}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>🎲 Place Your Bet</div>
              <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>
                Will {target?.name} hit their goal this week?
              </div>

              <div style={{
                padding: "16px", borderRadius: 12,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                marginBottom: 20,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 28 }}>{target?.avatar}</span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{target?.name}</div>
                    <div style={{ fontSize: 12, color: "#64748B" }}>
                      {targetGoal?.icon} {targetGoal?.text} — {targetGoal?.completed}/{targetGoal?.freq} so far
                    </div>
                    <div style={{ fontSize: 11, color: "#F59E0B", marginTop: 2 }}>
                      🔥 {target?.streak}w streak · {target?.completion}% avg
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 13, fontWeight: 700, color: "#94A3B8", marginBottom: 12, textAlign: "center" }}>
                Budget: {betBudget} pts remaining
              </div>

              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {[
                  { label: "They'll crush it ✅", prediction: "yes", color: "#10B981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" },
                  { label: "They'll miss it ❌", prediction: "no", color: "#EF4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
                ].map(opt => (
                  <button key={opt.prediction} onClick={() => placeBet(showBetSheet, opt.prediction, 20)}
                    style={{
                      flex: 1, padding: "16px 12px", borderRadius: 12,
                      background: opt.bg, border: `1px solid ${opt.border}`,
                      color: opt.color, fontSize: 13, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {opt.label}
                    <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>20 pts</div>
                  </button>
                ))}
              </div>

              <button onClick={() => setShowBetSheet(null)} style={{ ...styles.btn("ghost"), width: "100%" }}>
                Skip for now
              </button>
            </div>
          </div>
        );
      })()}

      {/* ─── CONSEQUENCE VOTING ──────────────────────────────────────────── */}
      {showConsequences && (
        <div style={styles.modal} onClick={e => e.target === e.currentTarget && setShowConsequences(false)}>
          <div style={styles.modalContent}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>⚠️ Vote: Consequence</div>
            <div style={{ fontSize: 12, color: "#64748B", marginBottom: 20 }}>
              What should last place face at month-end?
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
              {CONSEQUENCE_OPTIONS.map((opt, i) => (
                <button key={i} onClick={() => setConsequenceVote(i)} style={{
                  padding: "14px 16px", borderRadius: 12, textAlign: "left",
                  background: consequenceVote === i ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.03)",
                  border: consequenceVote === i ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  color: consequenceVote === i ? "#F87171" : "#CBD5E1",
                  fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  {opt}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowConsequences(false)} style={{ ...styles.btn("ghost"), flex: 1 }}>Cancel</button>
              <button onClick={() => { setShowConsequences(false); showToast("Vote submitted! 🗳"); }}
                disabled={consequenceVote === null}
                style={{ ...styles.btn("primary"), flex: 2, opacity: consequenceVote !== null ? 1 : 0.4 }}>
                Submit Vote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
