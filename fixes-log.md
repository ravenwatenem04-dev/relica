# Security Fixes Log — AHH-18: Security Audit Pass 2

> **Project:** relica (multica-console) — Fastify v5 TypeScript monorepo
> **Audit Date:** 2026-05-29
> **Total Findings:** 13 (3 Critical, 3 High, 4 Medium, 3 Low)
> **Fix Sub-Issues Created:** [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454), [AHH-19](mention://issue/c8568d0f-83af-4b95-8022-2bdbbb25d1f6), [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8), [AHH-23](mention://issue/86a2d969-f564-4735-925e-b48c5b34b621), [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc)

---

## Audit Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 3 | In Progress |
| High     | 3 | In Progress |
| Medium   | 4 | In Progress |
| Low      | 3 | In Progress |
| **Total**| **13** | |

---

## Finding Index

| ID  | Severity | CWE    | Description | Assigned To | Status |
|-----|----------|--------|-------------|-------------|--------|
| C-1 | Critical | CWE-306 | Session Middleware Never Registered | [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454) | In Progress |
| C-2 | Critical | CWE-754 | Multica API Client Never Wired Up | [AHH-19](mention://issue/c8568d0f-83af-4b95-8022-2bdbbb25d1f6) | In Progress |
| C-3 | Critical | CWE-306 | All Mutation Endpoints Unauthenticated | [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454) | In Progress |
| H-1 | High     | CWE-209 | No Global Error Handler | [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | In Progress |
| H-2 | High     | CWE-280 | Optional Chaining Silently Skips Auth | [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | In Progress |
| H-3 | High     | CWE-1113| Auth Test Is a No-Op | [AHH-23](mention://issue/86a2d969-f564-4735-925e-b48c5b34b621) | Backlog |
| M-1 | Medium   | CWE-614 | Session Cookie Security Attributes Not Set | [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454) | In Progress |
| M-2 | Medium   | CWE-942 | CORS Allows Credentials Without Origin Validation | [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | In Progress |
| M-3 | Medium   | CWE-200 | Server Binds to All Interfaces | [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454) | In Progress |
| M-4 | Medium   | CWE-330 | Weak Default SESSION_SECRET | [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | In Progress |
| L-1 | Low      | CWE-1321| ioredis Version Allows Vulnerable 5.4.1 | [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | In Progress |
| L-2 | Low      | CWE-798 | Hardcoded Redis Default URL | [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | In Progress |
| L-3 | Low      | CWE-252 | API Calls Silently Fail via Optional Chaining | [AHH-19](mention://issue/c8568d0f-83af-4b95-8022-2bdbbb25d1f6) | In Progress |
| I-1 | N/A      | N/A     | Missing .gitignore | [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc) | In Progress |
| I-2 | N/A      | N/A     | Missing Security Headers (Helmet) | [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc) | In Progress |
| I-3 | N/A      | N/A     | Missing TypeBox Validation on Routes | [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc) | In Progress |
| I-4 | N/A      | N/A     | Cross-Package Import Coupling | [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc) | In Progress |

---

## Detailed Findings & Fix Strategies

### C-1: Session Middleware Never Registered (CWE-306) — `server.ts`

**Finding:** `@fastify/session` and `@fastify/cookie` are declared as dependencies (`package.json:16-17`) but never imported or registered in `server.ts`. `SESSION_SECRET` is validated at startup (`config.ts:22-23`) but never consumed. All 22 API endpoints are unauthenticated.

**Exploit:** An attacker can call any API endpoint without a session cookie and get full read/write access.

**Fix Strategy:** Register `@fastify/cookie` first, then `@fastify/session` with `connect-redis` store pointing at the existing Redis data client. Add a global `preHandler` hook that returns 401 when `request.session.get('workspaceId')` is missing, with `/health` excluded.

**Why This Approach:**
- Cookie plugin MUST be registered before session plugin (Fastify-session requirement)
- Using `connect-redis` for session persistence avoids in-memory session loss on server restart
- Global preHandler covers all routes including future additions, avoiding per-route auth checks
- `/health` exclusion allows load balancer health checks without session overhead
- Using `request.session.get()` API instead of property access ensures type-safe access

**Sub-issue:** [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454)

---

### C-2: Multica API Client Never Wired Up (CWE-754) — All Route Files

**Finding:** `request.multicaClient` is referenced in every route module but never attached to the request via Fastify's `decorate` or middleware. All calls use optional chaining (`?.`), so every API call silently resolves to `undefined`.

**Exploit:** The backend returns empty data for all operations — non-functional for any read or write operation.

**Fix Strategy:** Create a `MulticaClient` class using Node.js built-in `fetch` that implements the `MulticaPollerClient` interface. Create a Fastify plugin that decorates each request with a new client instance. Replace the stub poller client in `server.ts:37-44` with the real client. Remove all `?.` optional chaining from route files.

**Why This Approach:**
- Node.js built-in `fetch` (Node 18+) avoids adding third-party HTTP client dependencies
- Fastify plugin pattern with `decorateRequest` keeps client initialization in one place
- Direct property access (without `?.`) makes failures explicit rather than silent
- Implementing `MulticaPollerClient` interface ensures compatibility with the event poller
- Separate `MulticaClient` class enables unit testing of API calls without Fastify

**Sub-issue:** [AHH-19](mention://issue/c8568d0f-83af-4b95-8022-2bdbbb25d1f6)

---

### C-3: All Mutation Endpoints Unauthenticated (CWE-306) — Various Routes

**Finding:** POST and PATCH endpoints across `issues.ts:153,181,216,237,259`, `comments.ts:37`, `runs.ts:51,63`, and `reviews.ts:15,33` have zero authentication.

**Fix Strategy:** Same global auth preHandler from C-1 covers all mutation endpoints automatically.

**Why This Approach:**
- Centralized auth check avoids per-route duplication
- Prevents new routes from accidentally being added without auth
- Consistent error response format across all endpoints

**Sub-issue:** [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454)

---

### H-1: No Global Error Handler (CWE-209) — `server.ts`

**Finding:** No `setErrorHandler` is registered on the Fastify instance. Fastify v5 defaults to returning `{ statusCode, error, message }` which may include stack traces in non-production mode.

**Exploit:** Error responses may expose stack traces, internal file paths, and function names to attackers.

**Fix Strategy:** Register `fastify.setErrorHandler` that logs the full error via `app.log.error()` but returns only `{ error: 'Internal Server Error' }` to clients.

**Why This Approach:**
- Logging the full error internally preserves debugging capability
- Sanitized client response prevents information leakage
- Registration before route definitions ensures all route errors are caught

**Sub-issue:** [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8)

---

### H-2: Optional Chaining Silently Skips Auth (CWE-280) — `events.ts:78`

**Finding:** `request.session?.workspaceId` at `events.ts:78` uses optional chaining which silently returns `undefined` if session is partially initialized rather than enforcing auth.

**Fix Strategy:** Replace with `request.session.get('workspaceId')` — the proper fastify-session API — without optional chaining.

**Why This Approach:**
- `request.session.get()` is the documented Fastify-session type-safe API
- Removing optional chaining makes failures explicit (throws if session not registered)
- Once session middleware is registered (C-1), session will always exist on the request

**Sub-issue:** [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8)

---

### H-3: Auth Test Is a No-Op (CWE-1113) — `test/events.test.ts:110-113`

**Finding:** The "requires authentication" test just asserts `statusCode === 401` where both values are hardcoded. No Fastify instance is created, no request is sent.

**Fix Strategy:** Write real integration tests using Fastify's `inject()` method with a test instance that registers session middleware and all route plugins. Verify 401 on protected endpoints and 200 on `/health`.

**Why This Approach:**
- Fastify `inject()` tests the full request/response lifecycle without network overhead
- In-memory session store avoids Redis dependency in tests
- Testing each endpoint category (GET, POST, PATCH, SSE) validates the auth preHandler thoroughly

**Sub-issue:** [AHH-23](mention://issue/86a2d969-f564-4735-925e-b48c5b34b621) (backlog — blocked by SEC-1)

---

### M-1: Session Cookie Security Attributes Not Configured (CWE-614) — `server.ts`

**Finding:** When session middleware is registered, no cookie attributes are configured. Missing HttpOnly, Secure, SameSite, and TTL.

**Fix Strategy:** Set `cookie: { httpOnly: true, secure: NODE_ENV === 'production', sameSite: 'lax', maxAge: 86400000, path: '/' }` in session config. Wire Redis store with matching TTL.

**Why This Approach:**
- `httpOnly: true` prevents JavaScript access to session cookies (XSS mitigation)
- `secure` conditional allows local development while enforcing HTTPS in production
- `sameSite: 'lax'` prevents CSRF while allowing normal navigation
- 24-hour TTL provides reasonable session lifetime balance (security vs. usability)
- Redis TTL matching cookie maxAge ensures consistent expiration

**Sub-issue:** [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454)

---

### M-2: CORS Allows Credentials Without Origin Validation (CWE-942) — `server.ts:17-20`

**Finding:** `credentials: true` is set with a hardcoded `origin: ["http://localhost:3000"]`. No configurability for production.

**Fix Strategy:** Make CORS origin configurable via `CORS_ORIGIN` env var (comma-separated for multiple origins). Default to `http://localhost:3000` for development.

**Why This Approach:**
- Env var configurability allows production deployments to specify their domain
- Comma-separated format supports multiple origins (e.g., staging + production domains)
- Defaulting to localhost maintains local development experience

**Sub-issue:** [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8)

---

### M-3: Server Binds to All Interfaces (CWE-200) — `server.ts:74`

**Finding:** `host: "0.0.0.0"` exposes the server on all network interfaces.

**Fix Strategy:** Default to `127.0.0.1` with configurability via `HOST` env var.

**Why This Approach:**
- `127.0.0.1` is the secure default — only accessible from the same machine
- `HOST` env var allows binding to other interfaces in production (e.g., in Docker)
- Defense in depth: even without auth, the server isn't exposed to the network

**Sub-issue:** [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454)

---

### M-4: Weak Default SESSION_SECRET (CWE-330) — `.env.example:4`

**Finding:** `.env.example` contains `SESSION_SECRET=change-me-in-production`. A developer deploying with this value exposes a well-known session signing key.

**Fix Strategy:** Replace with a randomly generated 64-character hex string and add a warning comment.

**Why This Approach:**
- 64 hex chars = 256 bits of entropy, sufficient for session signing
- Warning comment catches attention during deployment review
- Random per-deployment value prevents cross-instance session forgery

**Sub-issue:** [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8)

---

### L-1: ioredis Version Range Allows Vulnerable Version (CWE-1321) — `package.json:19`

**Finding:** `ioredis: ^5.4.0` resolves to `>=5.4.0 <6.0.0`. Version 5.4.1 is vulnerable to prototype pollution (CVE-2024-49712). Fixed in 5.4.2+.

**Fix Strategy:** Pin to `ioredis@^5.4.2`.

**Why This Approach:**
- Minimum safe version ensures the vulnerability is excluded
- `^` prefix still allows future non-breaking updates within v5.x

**Sub-issue:** [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8)

---

### L-2: Hardcoded Redis Default URL (CWE-798) — `config.ts:26`

**Finding:** `REDIS_URL` defaults to `redis://localhost:6379` without authentication. A misconfigured deployment connects to local Redis without auth.

**Fix Strategy:** Remove the default — `REDIS_URL` fails at startup if not configured in production.

**Why This Approach:**
- Failing fast at startup is better than silently connecting to wrong Redis
- Forces explicit configuration for every deployment
- Prevents accidental connection to local Redis in staging/production

**Sub-issue:** [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8)

---

### L-3: API Calls Silently Fail via Optional Chaining (CWE-252) — Multiple Routes

**Finding:** All multicaClient calls in `runs.ts:27,36,47,56,67`, `comments.ts:31,47,57,74`, `reviews.ts:9,20,24,40` use `?.` which silently returns undefined when the client is missing.

**Fix Strategy:** Implement the real `MulticaClient` (see C-2) and remove all `?.` optional chaining. Wrap calls in try/catch with proper error responses.

**Why This Approach:**
- Real client implementation eliminates the root cause
- Direct property access catches missing client at compile time via TypeScript
- Try/catch provides proper error responses to API consumers

**Sub-issue:** [AHH-19](mention://issue/c8568d0f-83af-4b95-8022-2bdbbb25d1f6)

---

### I-1: Missing .gitignore

**Finding:** No `.gitignore` exists anywhere in the repository. `node_modules/`, `.env`, `dist/` are tracked by git.

**Fix Strategy:** Create comprehensive `.gitignore` with standard Node.js/TypeScript monorepo patterns.

**Sub-issue:** [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc)

---

### I-2: Missing Security Headers (Helmet)

**Finding:** No `@fastify/helmet` or similar middleware. Missing CSP, X-Frame-Options, X-Content-Type-Options headers.

**Fix Strategy:** Install and register `@fastify/helmet` with defaults.

**Sub-issue:** [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc)

---

### I-3: Missing TypeBox Validation on Routes

**Finding:** `comments.ts`, `runs.ts`, `reviews.ts` use manual validation or no validation at all.

**Fix Strategy:** Add TypeBox schemas to all unvalidated POST/PATCH endpoints.

**Sub-issue:** [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc)

---

### I-4: Cross-Package Import Coupling

**Finding:** `packages/web/src/lib/event-handler.ts` imports from `../../../backend/src/lib/event-store.js`, coupling frontend build to backend source.

**Fix Strategy:** Move shared types (`WorkspaceEvent`, `EventType`, event interfaces) to `packages/shared/src/types/events.ts` and update imports.

**Sub-issue:** [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc)

---

## Execution Plan

### Phase 1: Parallel Fixes (Running Now)

| Sub-Issue | Agent | Covers | Status |
|-----------|-------|--------|--------|
| [AHH-22](mention://issue/b2782f33-010f-42ef-9297-dda5818dd454) | deepseek code 1 | C-1, C-3, M-1, M-3 | In Progress |
| [AHH-19](mention://issue/c8568d0f-83af-4b95-8022-2bdbbb25d1f6) | deepseak code 2 | C-2, L-3 | In Progress |
| [AHH-20](mention://issue/9bb895cf-8c0b-4dd4-8ba0-fe09984671f8) | deepseak 3 | H-1, H-2, M-2, M-4, L-1, L-2 | In Progress |
| [AHH-21](mention://issue/f96059f3-278c-4cb2-97aa-3a18412468fc) | deepseak code 2 | I-1, I-2, I-3, I-4 | In Progress |

### Phase 2: Auth Tests (After Phase 1)

| Sub-Issue | Agent | Covers | Status |
|-----------|-------|--------|--------|
| [AHH-23](mention://issue/86a2d969-f564-4735-925e-b48c5b34b621) | deepseek code 1 | H-3 | Backlog |

---

## Fix Verification Checklist

- [ ] `tsc --noEmit` passes in all packages
- [ ] `npx vitest run` passes all tests
- [ ] `GET /health` returns 200 without session
- [ ] All other endpoints return 401 without session
- [ ] Session cookie has HttpOnly, Secure, SameSite attributes
- [ ] Error responses never expose stack traces
- [ ] CORS origin is configurable via env var
- [ ] Server binds to 127.0.0.1 by default
- [ ] ioredis pinned to ^5.4.2+
- [ ] REDIS_URL has no hardcoded default
- [ ] `.gitignore` exists and covers standard patterns
- [ ] `@fastify/helmet` is registered
- [ ] All route POST bodies have TypeBox validation
- [ ] Shared types live in `@multica-console/shared`
- [ ] No cross-package relative imports to backend source
