# Task Specifications — Multica Console v2

## Task 1.1 — Fix Multica API Client Session Token Flow

### Context
The backend auth plugin creates a MulticaClient when a token exists in the session. But the login flow and token propagation need verification. This is the foundation — no data loads without this working.

### Objective
Ensure POST /api/auth/login accepts a user's Multica API token, stores it in the session, and creates a working MulticaClient that successfully calls the Multica platform API.

### Inputs
- `packages/backend/src/plugins/auth.ts`
- `packages/backend/src/routes/auth.ts`
- `packages/backend/src/lib/multica-client.ts`
- `.env` with MULTICA_API_URL=https://api.multica.ai

### Outputs
- Updated `packages/backend/src/lib/multica-client.ts` — verified working client
- Updated `packages/backend/src/routes/auth.ts` — stores token + user info + workspaceId
- Verified GET /api/agents returns real workspace agents after login

### Acceptance Criteria
1. POST /api/auth/login with valid token → 200, sets cookie, returns user data
2. POST /api/auth/login with invalid token → 401, clear error message
3. GET /api/auth/me with valid session → 200, returns user profile
4. GET /api/agents with valid session → 200, returns real agent list from Multica
5. GET /api/issues with valid session → 200, returns real issues from Multica
6. No 500 errors from any endpoint when authenticated

### Technical Specifications
- MulticaClient must use `globalThis.fetch()` (Node 18+ built-in)
- All requests: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Login handler: calls Multica API to validate token before storing
- Session stores: `token`, `workspaceId`, `userId`, `userName`
- Error responses: catch and return `{ error: message }` with proper status code, never expose stack traces

### Dependencies
- **Blocked by:** Nothing
- **Blocks:** 1.2, 1.3, all subsequent tasks

### Agent Assignment
- **Specialist Type:** Backend
- **Estimated Complexity:** Medium

---

## Task 1.2 — Fix All Backend Route Handlers

### Context
Route files proxy calls to MulticaClient. After Task 1.1 fixes the client, all routes must consistently handle errors, use proper auth guards, and return correct response shapes.

### Objective
Ensure every backend route handles auth, errors, and data proxying correctly.

### Inputs
- All files under `packages/backend/src/routes/`

### Outputs
- Updated routes with consistent try/catch error handling
- All routes use `preHandler: requireAuth`
- Comments route creates and retrieves real comments

### Acceptance Criteria
1. All routes return 401 without session (no 500 crashes)
2. All routes return correct data with real session
3. POST /api/issues creates a real issue in Multica
4. POST /api/issues/:id/comments creates a visible comment
5. POST /api/issues/:id/status changes issue status
6. POST /api/issues/:id/assign assigns an agent

### Technical Specifications
- Consistent pattern: `try { ... } catch (e) { return reply.code(e.statusCode || 500).send({ error: e.message }) }`
- List endpoints: support `?limit=` and `?offset=` query params
- Results sorted: agents by status priority, issues by updated_at DESC

### Dependencies
- **Blocked by:** Task 1.1
- **Blocks:** Task 1.3

### Agent Assignment
- **Specialist Type:** Backend
- **Estimated Complexity:** Medium

---

## Task 1.3 — Web: Fix Auth Flow and Data Fetching

### Context
The login flow has potential redirect loops. Dashboard pages fetch data but may hit 401 during redirect window. All pages need to properly handle auth state.

### Objective
Fix login → dashboard flow so pages load and display real data without redirect loops.

### Inputs
- `packages/web/src/app/page.tsx` (login)
- `packages/web/src/app/dashboard/layout.tsx`
- All dashboard page.tsx files

### Outputs
- Updated login page with proper error/loading states
- Updated dashboard layout — no redirect loop
- Updated dashboard showing real API counts
- All sub-pages loading real data

### Acceptance Criteria
1. Valid login → /dashboard shows user name
2. Invalid login → error on login page (no redirect)
3. /dashboard/agents shows real agents with status and current task
4. /dashboard/issues shows real issues table with working filters
5. Navigation preserves auth — no redirect-to-login on tab switches
6. Sign out clears session, returns to login

### Technical Specifications
- Dashboard layout: useQuery for /api/auth/me with staleTime: 5min
- On 401: redirect to / only if path is NOT "/" (prevents loop)
- Login: disable submit during loading, show error below form
- Dashboard cards: fetch counts from API with staleTime: 30s

### Dependencies
- **Blocked by:** Task 1.1, 1.2
- **Blocks:** Phase 2, Phase 3

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Medium

---

## Task 2.1 — TanStack Query Caching Strategy

### Objective
Add stale times and cache invalidation so navigation feels instant.

### Outputs
- Updated QueryClient defaults: `staleTime: 30000, retry: 1, refetchOnWindowFocus: false`
- Per-query overrides: usage staleTime 5min
- Cache invalidation after POST/PATCH mutations
- Manual refetch button on each list page

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Low

---

## Task 2.2 — Loading Skeletons and Empty States

### Objective
Replace bare "Loading..." text with animated skeleton loaders. Add proper empty and error states.

### Outputs
- `packages/web/src/components/ui/Skeleton.tsx`
- `packages/web/src/components/ui/EmptyState.tsx`
- `packages/web/src/components/ui/ErrorState.tsx`
- Updated all pages to use these components

### Acceptance Criteria
1. Lists show skeleton cards/rows during loading
2. Empty pages show icon + message
3. Errors show message + retry button
4. Skeleton shapes match loaded content dimensions

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Medium

---

## Task 2.3 — Code Splitting and Lazy Loading

### Objective
Lazy-load dashboard pages to reduce initial bundle size.

### Outputs
- Dashboard layout using Next.js `dynamic()` for all sub-pages
- Loading skeletons shown during chunk load

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Low

---

## Task 3.1 — Issue Detail Page

### Objective
Build full issue detail page with metadata, status controls, assignment, and comments section placeholder.

### Outputs
- `packages/web/src/app/dashboard/issues/[id]/page.tsx`
- `packages/web/src/components/issues/IssueHeader.tsx`
- `packages/web/src/components/issues/IssueMetadata.tsx`
- `packages/web/src/components/issues/IssueActions.tsx`
- Click-to-navigate on issue list rows

### Acceptance Criteria
1. Click issue row → navigates to /dashboard/issues/:id
2. Shows title, description (markdown), status, priority, assignee
3. Status dropdown changes status with optimistic update
4. Assign button opens searchable agent selector
5. Back link preserves filter state via URL params

### Technical Specifications
- Markdown: react-markdown + remark-gfm
- Optimistic updates: update QueryClient cache immediately, revert on error
- Agent selector: searchable, shows name + status dot
- URL filters: useSearchParams() for status persistence

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** High

---

## Task 3.2 — Comments / Chat UI

### Objective
Build comment thread UI that lets you post comments and see agent replies — this is the "chat with agents" feature.

### Outputs
- `packages/web/src/components/comments/CommentList.tsx`
- `packages/web/src/components/comments/CommentItem.tsx`
- `packages/web/src/components/comments/CommentForm.tsx`
- `packages/web/src/components/comments/ReplyThread.tsx`
- Integration into issue detail page

### Behavior
- Activity timeline with author type badges (human/agent/system)
- Agent comments highlighted with green accent
- Reply button opens inline form, submit on Ctrl+Enter
- Markdown rendering for comment content
- Relative timestamps ("2m ago"), absolute on hover
- Optimistic add, revert on error

### Acceptance Criteria
1. Comments load and display for an issue
2. Posting a comment appears immediately
3. Agent comments visually distinct (green border)
4. Reply threads expand/collapse
5. Empty: "No comments yet"

### Technical Specifications
- No external date library — simple relative time formatter
- Reply form: auto-focus, submit on Ctrl+Enter
- Optimistic: temp ID, replace on server response

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** High

---

## Task 3.3 — SSE Real-Time Integration

### Objective
Connect to SSE stream, auto-refresh data when agents/issues change.

### Outputs
- `packages/web/src/hooks/useRealtimeEvents.ts`
- Updated dashboard layout with SSE hook
- Connection indicator in header
- Reconnection banner when stream drops

### Behavior
- Event → cache invalidation mapping
- Auto-reconnect with 5s-30s exponential backoff
- Refresh all queries on reconnect after >30s gap

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Medium

---

## Task 3.4 — Error Boundary + Toast Notifications

### Objective
Global error handling and visual feedback for user actions.

### Outputs
- `packages/web/src/components/ui/ErrorBoundary.tsx`
- `packages/web/src/components/ui/Toast.tsx`
- Toast context provider
- Integration in all mutation operations

### Acceptance Criteria
1. React errors show fallback UI with reload button
2. Success actions show green toast
3. Failed actions show red toast
4. Toasts auto-dismiss after 5s (configurable)
5. Max 3 visible toasts

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Low

---

## Task 4.1 — Design Tokens CSS File

### Objective
Create CSS custom properties file from design-config.md.

### Outputs
- `packages/web/src/app/globals.css` with all tokens
- Migrate all inline styles to CSS variables

### Token naming: `--mc-bg-primary`, `--mc-accent`, `--mc-border`, `--mc-radius-lg`, etc.

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Low

---

## Task 4.2 — Component Library Rebuild

### Objective
Build reusable components using design tokens.

### Outputs
- `packages/web/src/components/ui/Button.tsx` (variants: primary, secondary, ghost, danger)
- `packages/web/src/components/ui/Badge.tsx` (colors: green, amber, red, gray)
- `packages/web/src/components/ui/Card.tsx`
- `packages/web/src/components/ui/Input.tsx`
- `packages/web/src/components/ui/Table.tsx`
- `packages/web/src/components/ui/StatusDot.tsx` (animated pulse for running)

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Medium

---

## Tasks 4.3-4.5 — Page Rebuilds

### Objective
Rebuild Dashboard, Agents, Issues, Usage pages using component library with professional design quality.

### Acceptance Criteria
1. All pages match design-config colors, spacing, typography
2. Loading skeleton, empty state, error state on every page
3. Responsive sidebar (collapses at <900px)
4. Hover/focus/active states on all interactive elements
5. No inline style objects — all styles via CSS variables

### Agent Assignment
- **Specialist Type:** Frontend
- **Estimated Complexity:** Medium per page

---

## Tasks 5.1-5.3 — Quality, Responsive, Testing

### 5.1 — Error Handling Everywhere
- Wrap every fetch call in try/catch
- Handle network errors, auth expiry (401), rate limits (429)
- Show appropriate error UI per error type

### 5.2 — Responsive Layout + Dark Mode Polish
- Sidebar collapses to hamburger at <900px
- Table scrolls horizontally on narrow screens
- Consistent spacing at all breakpoints

### 5.3 — End-to-End Flow Testing
- Login → Dashboard → Create Issue → Assign Agent → Comment
- Verify all mutations update UI optimistically
- Verify SSE updates reflect in real time
- Test error scenarios: network down, invalid token, expired session
