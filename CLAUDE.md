# CLAUDE.md — Riko's Birthday Cafe

## Project Overview

Fan birthday-cafe site for VTuber **Yuzuha Riko**. Users play mini-games, earn achievements, and celebrate her birthday. All interaction is click/drag-based (no free-text input).

## Repo Structure

```
rico-birthday-cafe/
├── frontend/          # React 18 + Vite + TypeScript
├── backend/           # Spring Boot 3.x (Java 17)
├── start_dev.sh       # Starts DB (Docker), backend (Gradle), frontend (Vite) together
└── PROJECT_SPEC.md    # Full feature/DB/API spec (source of truth)
```

## Development

```bash
# Full local stack (requires Docker Desktop + .env file)
./start_dev.sh

# Frontend only
cd frontend && npm run dev

# Frontend build
npm run build   # from repo root — delegates to frontend/
```

URLs: Frontend `http://localhost:5173` · Backend `http://localhost:8080` · DB `localhost:5432`

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Framer Motion |
| Game rendering | Pixi.js + @pixi/react |
| Drag & drop | @dnd-kit |
| Backend | Spring Boot 3, Java 17, Spring Security + JWT |
| Database | PostgreSQL (Docker in local dev, Render in prod) |

## Frontend Conventions

- **Styling:** Tailwind CSS only — no inline style objects except where Pixi or Framer Motion require it.
- **Icons:** `lucide-react` exclusively. No emoji in UI/game graphics.
- **State:** Zustand stores in `src/store/`. Server state via `@tanstack/react-query`.
- **Layout pattern:** All game pages use `<GameContainer>` wrapper (handles header, return button, help slides).
- **Mobile/Desktop split:** Detect with `window.matchMedia("(pointer: coarse)") || innerWidth < 1024`. Separate panel components are acceptable when layouts diverge significantly (see `AdventureGamePanel` vs `AdventureGamePanelMobile`).

## Pixi / Canvas Sizing Rules

- The `stageViewportRef` div (which Pixi measures) must sit inside an **explicitly-sized parent** so `h-full` resolves correctly.
- `useLayoutEffect` that attaches a `ResizeObserver` to `stageViewportRef` **must include `isMobileViewport` in its dependency array** — the ref points to different DOM elements depending on which panel is mounted.
- Do **not** reset `stageViewportSize` to `{0,0}` inside that layout effect. React 18 batches the state updates; the reset only forces an unnecessary Application unmount/remount.
- `viewportOffsetY` for the Pixi stage uses `(stageHeight - WORLD_HEIGHT * uniformScale) / 2` (centered). Do not push the world to the bottom with an aggressive formula — it causes the sky to dominate and gameplay to be invisible.
- Avoid `dvh`/`vh` for canvas container heights on mobile; use fixed `rem` values (`h-[28rem]`) so the size is stable when browser chrome collapses/expands.

## Key Files

| File | Purpose |
|---|---|
| `src/pages/AdventureGame.tsx` | Adventure game page — YouTube sync, run-state machine, mobile/desktop panel switch |
| `src/features/adventure/adventureGameCore.tsx` | Pixi `RunnerScene` — all game physics, rendering, world scaling |
| `src/components/game/adventureSample/AdventureGamePanel.tsx` | Desktop game panel layout |
| `src/components/game/adventureSample/AdventureGamePanelMobile.tsx` | Mobile game panel layout (independent design) |
| `src/components/common/GameContainer.tsx` | Shared page shell for all game routes |
| `src/features/adventure/adventureGameShared.ts` | Phase definitions, constants shared between page and core |

## Constraints

- No emoji in game UI or as icons — use `lucide-react`.
- No `overflow` hacks to fix canvas sizing; fix the layout/measurement instead.
- Mobile and desktop layouts for the Adventure game are intentionally separate components — do not merge them.
- Do not add docstrings, comments, or type annotations to code that was not changed.
- Do not introduce backwards-compatibility shims or re-export unused types.
