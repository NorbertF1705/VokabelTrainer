# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Type-check (tsc -b) then build for production
npm run preview    # Preview production build locally
```

No test or lint scripts are configured.

## Architecture

**Stack**: React 19 + TypeScript + React Router v6 + Vite + PWA (vite-plugin-pwa / Workbox)

### State Management

All global state lives in `src/context/LearningContext.tsx` via React Context. It owns:
- Selected language (`EN` | `ES`) and query direction
- Per-language vocabulary progress (`CardProgress`: box 1–6, nextDate, counts)
- Custom vocabulary (per language, stored separately from built-in)
- Daily card limits and daily stats
- Training log (dates per language for consistency tracking)

State is persisted with an async IndexedDB wrapper (`src/utils/storage.ts`) with localStorage fallback for iOS compatibility. Writes are debounced 300 ms.

### Spaced Repetition

Cards follow a 6-box Lernkartei system. Box intervals (days): `[0, 1, 3, 7, 14, ∞]` defined in `src/constants/theme.ts`. `markCard(vocabId, lang, correct)` moves cards up/down and recalculates `nextDate`. `getDueCards(lang)` filters by `nextDate ≤ today` and applies the daily limit.

### Vocabulary Data

Built-in vocabulary is in `src/data/vocabulary.ts` as `VOCABULARY_EN` and `VOCABULARY_ES` arrays. Each entry has: `id`, `german`, `translation`, `category`, optional `inflections`. Custom words are stored in IndexedDB and merged at runtime.

### Routing

Five pages wrapped in a `Layout` bottom-nav shell (defined in `src/components/Layout.tsx`):
- `/` — Home: language/direction picker, due-card counts, start button
- `/learn` — Flashcard session: due/all/quiz modes, keyboard shortcuts, Web Speech API audio
- `/vocabulary` — Browse, search, add/delete custom words
- `/statistics` — Box distribution, consistency (7/30/90 days), category breakdown
- `/settings` — Preferences, daily limit, auto-speak, reset progress

### PWA

Service worker is registered in `src/utils/serviceWorker.ts` with hourly update checks and iOS background-reactivation handling. Workbox strategy: CacheFirst for static assets (1-year expiry), NetworkFirst for HTML (5 s timeout, 7-day cache). The manifest targets standalone mode, portrait orientation.

### Key Interfaces

```ts
type Language = 'EN' | 'ES'
type QueryDirection = 'DE_TO_FOREIGN' | 'FOREIGN_TO_DE' | 'RANDOM'

interface CardProgress {
  box: number          // 1–6
  lastReviewed: string // ISO date
  nextDate: string     // ISO date
  correctCount: number
  incorrectCount: number
}
```
