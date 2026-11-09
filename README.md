# StudySentry

**Automated study accountability for students — offline-first, installable, 100% free.**

StudySentry nags you the moment you open it ("What work do you have to get done today?"), logs every assignment with a deadline and priority, tracks your daily streak, and celebrates when you clear your plate. No account. No cloud. No fees. Your data never leaves your device.

![CI](https://github.com/dharaneeshhariharan2011-oss/StudySentry/actions/workflows/ci.yml/badge.svg)

## Features

- **The Nag** — on launch, StudySentry detects unfinished work or a new day and prompts you with a fast capture sheet: subject, task, estimated minutes (with quick-pick chips), priority, and due date.
- **Dashboard & task tracker** — sorted by Priority → Due Date, filter by All / Pending / Completed / Subject, animated checkboxes, quick edit, and two-step delete.
- **Gamified accountability** — daily streak counter (with grace rules and best-streak memory), a "today's focus" progress bar (% of due/overdue work completed), and a confetti burst when you finish everything.
- **Insights** — 7-day completion momentum chart, per-subject progress roll-up, total focused minutes, and one-tap JSON export.
- **PWA / mobile-first** — standalone display, full offline support via a Workbox service worker, iOS "Add to Home Screen" coaching, and a one-tap install prompt on Android/Chrome.
- **Resilient storage** — a defensive `localStorage` wrapper with an in-memory fallback for private browsing / quota failures, and corruption-proof JSON loading.
- **Private by design** — zero backend, zero trackers. Everything is stored locally under `studysentry.*` keys.

## Tech Stack

| Layer      | Choice |
|------------|--------|
| Framework  | Vite + React 18 + TypeScript (App Router-grade structure, SPA) |
| Styling    | Tailwind CSS 3 (dark-mode-first, custom aurora theme) |
| Icons      | lucide-react |
| Effects    | canvas-confetti |
| Persistence| localStorage wrapper + React state (no database) |
| PWA        | vite-plugin-pwa (Workbox `generateSW`) + custom manifest & icons |
| Testing    | Vitest + Testing Library + jsdom (78 tests) |
| CI/CD      | GitHub Actions (`.github/workflows/ci.yml`) — typecheck, test, build |

## Quick Start

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
```

### Production

```bash
npm run build      # typecheck + build + generate service worker → dist/
npm run preview    # serve the production build (binds 0.0.0.0)
```

## Scripts

| Command             | What it does |
|---------------------|--------------|
| `npm run dev`       | Vite dev server |
| `npm run build`     | `tsc --noEmit` + production build + SW generation |
| `npm run preview`   | Serve `dist/` locally |
| `npm test`          | Run the full Vitest suite once |
| `npm run test:watch`| Watch mode |
| `npm run test:coverage` | Coverage report (v8) |
| `npm run typecheck` | Strict TypeScript check |
| `npm run icons`     | Regenerate PWA icons from `assets/icon-source.png` (uses sharp) |

## Testing

```bash
npm test
```

The suite covers the boring-but-critical parts:

- `src/lib/storage.test.ts` — roundtrip persistence, corrupt-JSON recovery, quota/private-mode fallback, validation.
- `src/lib/date.test.ts` — calendar-day math, overdue/today/tomorrow labels, ISO-day validation (incl. leap years and impossible dates).
- `src/lib/tasks.test.ts` — priority→due-date sorting, completion ordering, filters, the "today's work" progress scope (due-now → created-today fallback), streak and best-streak computation, weekly roll-up.
- `src/hooks/useTasks.test.tsx` — add/toggle/update/delete flows, localStorage hydration across sessions, confetti fired exactly once when the last daily task completes.
- `src/components/*.test.tsx` — the Nag modal (validation, Escape/backdrop dismiss, edit mode) and task items (animated checkbox, two-step delete, overdue labels).
- `src/App.test.tsx` — smoke tests for the whole screen, including The Nag auto-opening on first launch.

## Project Structure

```
├── .github/workflows/ci.yml   # CI: typecheck → test → build
├── assets/icon-source.png     # Source artwork for the icon generator
├── public/                    # Static assets copied verbatim into dist/
│   ├── favicon.svg
│   ├── icons/                 # 192/384/512 + maskable PWA icons
│   └── apple-touch-icon.png
├── scripts/generate-icons.mjs
├── src/
│   ├── App.tsx                # Composition root (tabs, FAB, nag gate)
│   ├── components/            # TaskModal, TaskList, TaskItem, FilterBar,
│   │                          # ProgressBar, StreakCounter, Analytics, …
│   ├── hooks/                 # useTasks, useLocalStorage, usePWAInstall
│   ├── lib/                   # storage.ts, tasks.ts, date.ts, look.ts
│   └── test/setup.ts
├── index.html                 # PWA meta (theme-color, apple-* capable)
├── vite.config.ts             # Vite + PWA + Vitest configuration
└── tailwind.config.js
```

## Installing as an App

**iPhone / iPad (Safari):** open the deployed site → tap the **Share** button → **Add to Home Screen**. StudySentry runs fullscreen with its own icon and works offline.

**Android / Chrome:** open the site → tap the install banner's **Install** button (or the ⋮ menu → **Add to Home screen**). It launches like a native app and keeps working with no network.

## Data & Privacy

Everything lives in `localStorage`:

- `studysentry.tasks.v1` — your tasks
- `studysentry.activity.v1` — days you logged or completed work (drives streaks)
- `studysentry.lastNagDay.v1` — last day the launch prompt was shown
- `studysentry.installDismissed.v1` — install banner preference

Use **Insights → Export data (JSON)** anytime to back up or move devices. Deleting site data in browser settings erases everything.

## License

MIT
