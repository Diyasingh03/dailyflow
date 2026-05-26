# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server → http://localhost:5173
npm test             # Run all tests (vitest, one-shot)
npm run test:watch   # Re-run tests on save
npm run test:ui      # Vitest browser UI
npm run lint         # ESLint

# Run a single test file
npx vitest run src/__tests__/Briefing.test.jsx
```

## Architecture

```
src/
├── api.js              # All backend calls — single source of truth
├── App.jsx             # BrowserRouter + 4 Routes + catch-all redirect to /
├── components/
│   ├── Layout.jsx      # Sidebar nav + <main> wrapper (wraps all pages)
│   └── LoadingSpinner.jsx
└── pages/
    ├── Briefing.jsx    # GET /briefing/today on mount; "Regenerate" triggers POST
    ├── Tasks.jsx       # CRUD + tab filter (all/pending/in_progress/completed)
    │                   # TaskCard sub-component owns subtask UI
    ├── Standup.jsx     # POST /standup/generate → sets current + prepends to history
    └── Insights.jsx    # ScoreRing SVG sub-component; score labels ≥70/≥40/<40
```

## Data Flow

**`api.js`** is the only file that calls `fetch()`. All pages import from `'../api'`.

```js
// Response handling in apiFetch():
return json.data !== undefined ? json.data : json;
// Backend returns { data: ..., error: null } on success, or plain objects
// Errors throw with json.detail || json.error || "Request failed"
```

## Page State Pattern

Every page uses local `useState` only — no global state or context. The standard shape:

```js
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => { loadData(); }, []);

const loadData = async () => {
  setLoading(true);
  try { setData(await api.someCall()); }
  catch (e) { setError(e.message); }
  finally { setLoading(false); }
};
```

## Testing

**Framework:** Vitest v4 + React Testing Library + `happy-dom` (configured in `vite.config.js`).

> **Do not switch to jsdom.** On Node 20.13, `html-encoding-sniffer` (a jsdom dep) requires CJS `@exodus/bytes` which is ESM-only — it crashes the test runner. `happy-dom` has no such conflict.

**Mock pattern for `api.js`** — always mock the entire module, then import after:

```js
vi.mock('../api', () => ({
  api: {
    getTodayBriefing: vi.fn(),
    regenerateBriefing: vi.fn(),
  },
}));

import { api } from '../api';  // gets the mocked version
```

**Router wrapper** — pages that use `<Link>` or `<NavLink>` must be wrapped:

```jsx
function renderPage() {
  return render(<MemoryRouter><PageComponent /></MemoryRouter>);
}
```

**Multiple elements pitfall** — `Standup.jsx` immediately prepends the generated standup to the history list, so its content appears in both the `<pre>` card and the history `<p>` snippet. Use `getAllByText` instead of `getByText` when asserting on standup content text.

**Setup file:** `src/setupTests.js` imports `@testing-library/jest-dom` which adds matchers like `toBeInTheDocument()`.

## Known Platform Quirk

`@rolldown/binding-win32-x64-msvc` is listed as an explicit dependency in `package.json`. This is required on Windows with Vite 8 — npm's optional dependency resolution skips it during `npm install`, causing a runtime crash. Keep it as a direct dep.
