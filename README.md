# ⚔️ Duelable

Social accountability meets fantasy sports for personal goals.

Friend groups form leagues, set weekly goals, bet on each other's consistency, submit photo proof, and compete — with playful consequences for whoever falls behind.

## Getting Started

```bash
npm install
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000)

## Build

```bash
npm run build
npm run preview
```

## Stack

- React 18
- Vite
- No external UI libraries — custom-built components

## Project Structure

```
duelable/
├── index.html          # Entry HTML
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx        # React mount
    ├── App.jsx         # App wrapper
    └── Duelable.jsx    # Main app component
```

## Features (Interactive Prototype)

- **Feed** — Weekly goal tracker, proof upload, activity feed with reactions & comments
- **Leaderboard** — Animated podium, full standings, betting system with point budgets
- **Profile** — Stats grid, weekly trend chart, league management
- **Betting** — Place yes/no bets on friends hitting their goals
- **Consequences** — Vote on month-end punishments for last place

## License

MIT
