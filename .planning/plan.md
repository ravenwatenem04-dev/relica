# Project Plan: Multica Console v2 — Data + Performance + Design Overhaul — v1

> Generated: 2026-05-30 | Scope: Large | Phases: 5 | Tasks: 19

## Changelog

- v1 — Initial plan

## Project Brief

- **Goal:** A production-quality Multica agent console web app that loads real data from Multica API, updates in real time, supports agent chat via comments, and has a polished professional UI matching Multica's design system.
- **Scope:** Large (15+ files modified, 10+ new files, 3 systems)
- **Users:** Single user managing their Multica agents from a web browser
- **Constraints:** TypeScript/Next.js frontend, Fastify BFF backend, Redis for realtime, no additional infrastructure
- **Non-goals:** iOS app changes, multi-user support, billing, mobile responsiveness beyond basic desktop

## Architecture

### Components

#### Web Frontend (Next.js 15)
- **Purpose:** User-facing console for managing agents, issues, comments, and usage
- **Type:** Frontend
- **Tech:** Next.js 15, React 19, TanStack Query v5, Tailwind CSS
- **Owns:** All UI components, pages, navigation, auth flow, real-time SSE client
- **Exposes:** Pages at /dashboard/*, login page at /
- **Consumes:** Backend BFF REST API, SSE event stream
- **Deployment:** Local dev on port 3000

#### Backend BFF (Fastify)
- **Purpose:** Proxies and reshapes Multica platform API data for web consumption
- **Type:** Backend API
- **Tech:** Fastify 5, TypeScript, ioredis, @sinclair/typebox
- **Owns:** Auth sessions, Multica API client, event polling, SSE streaming, usage aggregation
- **Exposes:** REST endpoints (/api/auth, /api/agents, /api/issues, /api/comments, /api/runs, /api/reviews, /api/usage, /api/events/stream)
- **Consumes:** Multica platform REST API
- **Deployment:** Local dev on port 3001

#### Redis
- **Purpose:** Session store, event pub/sub for real-time updates
- **Type:** Database/Cache
- **Tech:** Redis 7 (Windows native)
- **Owns:** Event history, pub/sub channels, session data
- **Exposes:** Key-value store, pub/sub channels
- **Consumes:** Nothing
- **Deployment:** Local on port 6379

#### Multica Platform API
- **Purpose:** Source of truth for all workspace data
- **Type:** External Service
- **Tech:** Multica REST API
- **Owns:** Workspaces, projects, agents, issues, comments, runs, metadata
- **Exposes:** REST API at api.multica.ai
- **Consumes:** Nothing
- **Deployment:** Cloud (managed)

### Connections

#### Web Frontend → Backend BFF
- **Protocol:** REST over HTTP
- **Data Shape:** JSON request/response matching API contracts
- **Auth:** Session cookie (multica_session)
- **Error Handling:** 401 redirects to login, other errors show toast/error state
- **Why:** Web app needs authenticated access to Multica data via BFF

#### Web Frontend → Backend BFF (SSE)
- **Protocol:** Server-Sent Events
- **Data Shape:** text/event-stream — event types: agent_status, issue_created, issue_updated, run_completed
- **Auth:** Session cookie
- **Error Handling:** Auto-reconnect with exponential backoff (5s-30s)
- **Why:** Real-time UI updates when agents/issue status changes

#### Backend BFF → Multica Platform API
- **Protocol:** REST over HTTPS
- **Data Shape:** JSON, snake_case keys
- **Auth:** Bearer token (user's API token)
- **Error Handling:** Retry 5xx once, map errors to standardized responses, never expose raw errors
- **Why:** BFF needs to fetch/create/update workspace data on behalf of the user

#### Backend BFF → Redis
- **Protocol:** Redis protocol over TCP
- **Data Shape:** String keys, JSON values
- **Auth:** None (local)
- **Error Handling:** Graceful fallback — disable realtime features, continue serving REST
- **Why:** Session persistence and event pub/sub for SSE broadcasting

## Execution Plan

### Phase 1: Data Pipeline Fix (Foundation)
These tasks fix the data flow so real Multica data appears on screen. Can run in parallel.

- Task 1.1 — Fix Multica API Client to use proper session tokens
- Task 1.2 — Verify and fix all backend route handlers for data proxying
- Task 1.3 — Web: Fix auth flow and data fetching to show real data

### Phase 2: Performance Foundation (Depends on Phase 1)
These make the app fast. Can run in parallel.

- Task 2.1 — Add TanStack Query caching strategy (stale times, retries)
- Task 2.2 — Add loading skeletons and empty states to all pages
- Task 2.3 — Code splitting and lazy loading for route pages

### Phase 3: Feature Completion (Depends on Phase 1)
These add comment/chat and real-time features. Can run in parallel.

- Task 3.1 — Build issue detail page with full metadata, status controls, assignment
- Task 3.2 — Build comment thread UI (flat timeline + threaded replies)
- Task 3.3 — Integrate SSE real-time updates on the web client
- Task 3.4 — Add web app error boundary and toast notification system

### Phase 4: UI/UX Overhaul (Depends on Phase 3)
These polish the visual design. Sequential within phase.

- Task 4.1 — Create design tokens CSS file from design-config.md
- Task 4.2 — Rebuild component library (Button, Badge, Card, Input, Table) with tokens
- Task 4.3 — Rebuild Dashboard page with live stats and design polish
- Task 4.4 — Rebuild Agents page with cards, quick status, and design polish
- Task 4.5 — Rebuild Issues page with table, filters, and design polish

### Phase 5: Quality & Polish (Depends on Phase 4)
- Task 5.1 — Add error handling to all API calls (network errors, auth expiry, rate limits)
- Task 5.2 — Responsive layout cleanup and dark mode polish
- Task 5.3 — End-to-end flow testing and bug fixes

### Parallelism Opportunities
- Phase 1: All 3 tasks can run in parallel (different files)
- Phase 2: All 3 tasks can run in parallel (different concerns)
- Phase 3: Tasks 3.1, 3.2, 3.3 can run in parallel; 3.4 after 3.1
- Phase 4: Tasks 4.1-4.2 must be sequential; 4.3-4.5 can then run in parallel

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Multica API schema changes break client | Medium | High | Use typed client with schema validation; add integration tests mocking API |
| Redis goes down during development | Low | Medium | All routes have no-Redis fallback; SSE gracefully degrades to polling |
| Large workspace data causes slow page loads | Medium | Medium | Add pagination, lazy loading, and virtual scrolling for large lists |
| Auth token expiry mid-session | Low | High | Detected 401 → redirect to login; add token refresh if API supports it |
| Design system doesn't match user expectations | Low | Medium | Share design-config.md early; get feedback before Phase 4 implementation |
| Browser caching stale data | Low | Medium | TanStack Query stale times + manual refetch buttons on every list page |

## Full Task Specs

Full task specifications are at `.planning/task-specs.md`.

