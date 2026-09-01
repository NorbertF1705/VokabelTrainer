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

## Release checklist — required for every user-visible change

This is a hard requirement, not optional cleanup. Any commit that changes app behavior (new feature, changed logic, UI change) MUST include all of the following in the same commit — never defer them to a follow-up:

1. **Bump the version** in both `package.json` and `src/version.ts` (keep them identical). Check the *current* version on `origin/main` first (`git fetch origin main && git show origin/main:src/version.ts`) rather than assuming your local checkout is up to date — a stale local branch is exactly how version numbers collide.
2. **Update `docs/Benutzerdokumentation.html`** (user-facing): describe the change wherever it's relevant (overview counts/lists, the relevant feature section, FAQ if it affects a common question), and add a dated entry at the top of the `#changelog` section (see existing entries for the exact markup pattern: bordered `div`, `badge` + date, `h4` "Neu"/"Geändert", `ul`).
3. **Update `docs/Entwicklerdokumentation.html`** (developer-facing): describe the technical implementation where relevant, and add a matching dated entry at the top of its own `#changelog` section.
4. **Update `docs/RELEASE_NOTES.md`**: add a dated `## vX.Y.Z — YYYY-MM-DD` section at the top, following the existing entries' style.
5. Only skip a doc file if the change is truly invisible to both users and developers (e.g. a pure typo fix in a comment) — when in doubt, update it.

Do this proactively without being asked — the user should not have to request version bumps or doc updates after the fact.

**Before starting any new work session on this repo**, verify the local branch is actually based on the current `origin/main` tip (`git fetch origin main && git log --oneline HEAD..origin/main`). If `main` has moved on, rebuild your working branch from `origin/main` first — don't build new commits on a stale base, since that reliably produces version-number collisions and documentation that describes the wrong app state.
