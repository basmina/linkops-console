# LinkOps Console

LinkOps Console is an operator console for a fleet of point-to-point radio links.
An operator opens it, sees every link with its live status and throughput, spots
the degraded ones, drills into a link to watch its telemetry, and edits link
configuration. Telemetry is produced by a simulator inside the API — there is no
real hardware and no external service. Everything runs locally, in memory.

Built as the RADWIN Web Architect home assignment.

- **Client:** Angular 22, standalone components, signal-first state, hand-rolled SVG sparkline
- **API:** NestJS 11, REST + one SSE stream, `class-validator` DTOs, Swagger
- **Workspace:** Nx 23 monorepo with enforced library boundaries, strict TypeScript
- **Storage:** in-memory `Map` behind a repository port — no database, Docker, or message broker

---
## 1. What this is

LinkOps Console is an operator console for a fleet of point-to-point radio links.

An operator opens it, sees every link with its live status and throughput, spots the degraded ones, drills into a link to watch its telemetry, and edits link configuration. Telemetry is produced by a simulator inside the API — there is no real hardware and no external service. Everything runs locally, in memory.

Built as the RADWIN Web Architect home assignment.

- **Client:** Angular 22, standalone components, signal-first state, hand-rolled SVG sparkline
- **API:** NestJS 11, REST + one SSE stream, `class-validator` DTOs, Swagger
- **Workspace:** Nx 23 monorepo with enforced library boundaries, strict TypeScript
- **Storage:** in-memory `Map` behind a repository port — no database, Docker, or message broker

## 2. Prerequisites

| Tool    | Version                  | Notes                                                   |
| ------- | ------------------------ | ------------------------------------------------------- |
| Node.js | **24.20.0**              | Pinned in [`.nvmrc`](.nvmrc). `nvm use` will select it. |
| npm     | 10+ (ships with Node 24) | pnpm/yarn are not used                                  |

```bash
node --version   # v24.20.0
npm --version
```

Nx libraries are consumed through TypeScript path mappings, so there is **no
shared-library build step** before the app runs.

---

## 3. Install

```bash
git clone https://github.com/basmina/linkops-console.git
cd linkops-console
nvm use            # optional, selects Node 24.20.0 from .nvmrc
npm install
```

`npm install` is the only install step. There is no `postinstall`.

---

## 4. Configuration

The application runs with **zero configuration**. Every variable is optional and
has a working default; there are no secrets or credentials in this project.
[`.env.example`](.env.example) documents them. Copy it to `.env` only to override
a default:

```bash
cp .env.example .env
```

| Variable   | What it does                                                    | Required | Default                 | Example      |
| ---------- | --------------------------------------------------------------- | -------- | ----------------------- | ------------ |
| `PORT`     | Port the NestJS API listens on                                  | No       | `3000`                  | `3001`       |
| `NODE_ENV` | When `production`, the Swagger UI at `/api/docs` is not mounted | No       | _(unset → development)_ | `production` |

`.env` is git-ignored; `.env.example` is committed. `npm start`, `npm test`, and
`npm run build` all work with no `.env` present.

---

## 5. Run it

### One command (API + client together)

```bash
npm start
```

This runs `nx run-many -t serve -p api client`. Both processes stream their logs
into the same terminal.

| Service          | URL                            | Port |
| ---------------- | ------------------------------ | ---- |
| API (NestJS)     | http://localhost:3000/api      | 3000 |
| Client (Angular) | http://localhost:4200          | 4200 |
| Swagger UI       | http://localhost:3000/api/docs | 3000 |

The Angular dev server proxies `/api/*` to the API via
[`apps/client/proxy.conf.json`](apps/client/proxy.conf.json), so the browser only
ever talks to `localhost:4200`.

### Separately

```bash
npm run start:api      # nx serve api
npm run start:client   # nx serve client
```

### What a working first load looks like

1. Open http://localhost:4200.
2. The fleet table shows **10 seeded links** (`Link-1` … `Link-10`). They briefly
   render as `down` before the first telemetry tick.
3. Within **~1 second** telemetry starts: throughput values move every second and
   status dots settle to a mix of `up` / `degraded` / `down`.
4. The KPI header shows **Total = 10**, with Up + Degraded + Down summing to 10,
   plus a live average throughput and the current worst link.
5. Filtering, sorting, and search update the URL query string; reloading the page
   restores the same view.

---

## 6. Test it

All suites are fast, deterministic, and require no running server.

```bash
npm test          # nx run-many -t test -p link data-access-links api client
```

| Command                     | Scope                                                                                                                        | Suites / tests | ~time |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | -------------- | ----- |
| `nx test link`              | domain: status derivation (`status.spec`), ring buffer, deterministic sample generation                                      | 3 / 15         | ~4 s  |
| `nx test data-access-links` | data-access: in-memory repository CRUD                                                                                       | 1 / 5          | ~3 s  |
| `nx test api`               | stream service + **HTTP contract test** (`api.contract.spec.ts`, Supertest against the real Nest app)                        | 2 / 13         | ~25 s |
| `nx test client`            | signal store, fleet view + error/retry states, `EventSourceFactory`, link form + create + detail (incl. conflict resolution) | 7 / 27         | ~10 s |

Run a single file while developing:

```bash
nx test api api.contract                                          # jest path filter
nx test client --include=apps/client/src/app/fleet/fleet.store.spec.ts
```

Full run is ~40 s cold, near-instant warm (Nx caches by project).

---

## 7. Project structure

```text
apps/
├── api/                         NestJS app shell  (tags: type:app, scope:api)
│   └── src/app/
│       ├── common/              HttpExceptionFilter — one error envelope for every failure
│       ├── links/               Link CRUD, DTOs, seeder, telemetry simulator
│       ├── fleet/               Fleet summary endpoint
│       ├── stream/              SSE controller + service (replay buffer, snapshot on connect)
│       └── api.contract.spec.ts HTTP-level contract test
│
└── client/                      Angular app shell  (tags: type:app, scope:client)
    └── src/app/fleet/
        ├── fleet.component.*     fleet table + KPI header
        ├── fleet.store.ts        signal-first state (links, telemetry, filter/sort)
        ├── fleet-api.service.ts  typed REST client
        ├── fleet-stream.service.ts   SSE → typed event stream
        ├── event-source.factory.ts   injectable EventSource (testable seam)
        ├── link-form/           presentational reactive form (create + edit)
        ├── link-create/         "New Link" route — POST /api/links
        └── link-detail/         detail view, sparkline, edit + delete

libs/
├── domain/link/                 (tags: type:domain, scope:shared)
│   └── src/lib/
│       ├── link.ts              Link, LinkConfig, LINK_LIMITS, Band/Mode/ChannelWidth
│       ├── telemetry.ts         TelemetrySample, TelemetryWindow
│       ├── fleet-summary.ts     FleetSummary
│       ├── status.ts            deriveStatus(link, latestSample, now) — pure
│       ├── generate-sample.ts   pure telemetry generator
│       ├── ring-buffer.ts       bounded RingBuffer<T>
│       ├── stream-event.ts      LinkStreamEvent discriminated union
│       ├── link-repository.ts   LinkRepository port
│       └── link-repository.token.ts   DI token
│
└── data-access/links/           (tags: type:data-access, scope:shared)
    └── src/lib/
        ├── in-memory-link.repository.ts   LinkRepository implementation
        └── seed-links.ts                  deterministic-shape fleet seed
```

### Dependency rule (enforced by lint)

```text
type:app  ──►  type:data-access  ──►  type:domain
   └─────────────────────────────────►  type:domain

scope:api / scope:client  ──►  scope:shared        (never each other)
```

`@nx/enforce-module-boundaries` in [`eslint.config.mjs`](eslint.config.mjs) turns
a violation into a **lint error**. The domain library depends on nothing but
itself — no NestJS, no Angular, no infrastructure. `nx graph` summary:

```text
api                 →  data-access-links, link
data-access-links   →  link
client              →  link
```

The client never imports `data-access` — it only knows the domain contract and
talks to the API over HTTP/SSE.

---

## 8. How it works

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │ apps/api                                                                │
 │                                                                        │
 │  TelemetrySimulatorService   every 1000 ms:                            │
 │    ├─ repo.findAll()                                                    │
 │    ├─ generateSample(link, previous)   (pure, domain)                  │
 │    ├─ RingBuffer.push(sample)          (bounded, 300 / link)           │
 │    ├─ deriveStatus(link, sample, now)  (pure, domain)                  │
 │    ├─ samplesGenerated$  ── one array per tick (all links) ──┐         │
 │    └─ statusChanged$     ── only when a link's status flips ─┤         │
 │                                                             ▼         │
 │  StreamService                                                         │
 │    ├─ wraps each event in { id, event }, appends to a 120-item history │
 │    ├─ throttles a fleet-summary recompute to every 5 s                 │
 │    └─ getEvents(lastEventId?)                                          │
 │         • no Last-Event-ID → send a summary + latest-telemetry         │
 │           snapshot frame (no id), then live events                     │
 │         • with Last-Event-ID → replay history where id > lastEventId,  │
 │           then live events                                            │
 │                                                                        │
 │  StreamController  @Sse()  maps { id, event } → SSE frame              │
 │    (id only set for replayable events, never for snapshot frames)      │
 └───────────────────────────────┬────────────────────────────────────────┘
                                 │  GET /api/stream   (EventSource)
                                 ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │ apps/client                                                             │
 │                                                                        │
 │  EventSourceFactory → FleetStreamService                               │
 │    JSON.parse → LinkStreamEvent  (telemetry | status | summary)        │
 │                                 │                                      │
 │  FleetStore (signals)           ▼                                      │
 │    telemetry  → latestTelemetry.update()  (one write per tick)         │
 │    status     → links.update()            (patch one link)             │
 │    summary    → summary.set()                                          │
 │                                                                        │
 │  Components use computed() signals + OnPush → only the changed         │
 │  rows/cells re-render, even at 1 Hz.                                    │
 └────────────────────────────────────────────────────────────────────────┘
```

**Link status** is never stored as fleet-of-truth. It is derived on every read by
`deriveStatus(link, latestSample, now)` in the domain library — `up` /
`degraded` / `down`, with `down` also when the newest sample is older than 5 s.
The same function is the only place status logic lives, so client and server
cannot diverge.

**Telemetry delivery:** the server pushes **one batched event per tick**
containing the latest sample for every link (not one event per sample). The
client keeps the latest sample per link in a signal and holds a short rolling
window for the detail sparkline; longer history is fetched on demand from
`GET /api/links/:id/telemetry`.

**Reconnect:** the browser's `EventSource` reconnects automatically and sends
`Last-Event-ID`. The server replays buffered events newer than that id from its
120-item history, then resumes live. A first-time client (no id) gets a snapshot
frame so the dashboard is populated immediately instead of waiting for the next
tick.

**Cleanup:** each SSE subscription is torn down when the client disconnects
(`EventSource.close()` → the RxJS teardown runs). Simulator intervals and stream
subjects are released in `onModuleDestroy`, and `main.ts` calls
`enableShutdownHooks()` so that fires on SIGINT/SIGTERM.

---

## 9. API reference

Base path: `/api`. Full interactive docs: **http://localhost:3000/api/docs**.

| Method   | Path                                     | Success     | Errors              | Notes                                                                                                            |
| -------- | ---------------------------------------- | ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `GET`    | `/api/links`                             | `200`       | —                   | All links with live-derived status. Filtering and sorting are client-side so the view state can live in the URL. |
| `GET`    | `/api/links/:id`                         | `200`       | `404`               | Single link.                                                                                                     |
| `POST`   | `/api/links`                             | `201`       | `400`, `409`        | `409` (`LINK_NAME_EXISTS`) if the name is taken. Used by the **New Link** form.                                  |
| `PATCH`  | `/api/links/:id`                         | `200`       | `400`, `404`, `409` | Body must include `version`; stale `version` → `409`.                                                            |
| `DELETE` | `/api/links/:id`                         | `204`       | `404`               | Also drops the link's telemetry buffers.                                                                         |
| `GET`    | `/api/links/:id/telemetry?window=1m\|5m` | `200`       | `400`, `404`        | `window` defaults to `5m`.                                                                                       |
| `GET`    | `/api/fleet/summary`                     | `200`       | —                   | `FleetSummary` KPI block.                                                                                        |
| `GET`    | `/api/stream`                            | `200` (SSE) | —                   | Supports `Last-Event-ID` reconnect.                                                                              |

### SSE events

One endpoint, three event types (discriminated union `LinkStreamEvent`):

```text
event: telemetry
id: 166
retry: 3000
data: {"type":"telemetry","sample":[
        {"linkId":"…","ts":"2026-09-10T09:00:01.000Z",
         "rssiDbm":-62,"snrDb":21,"throughputMbps":184}, …]}

event: status
id: 167
data: {"type":"status","linkId":"…","status":"degraded"}

event: summary
id: 168
data: {"type":"summary","summary":{
        "total":10,"up":6,"degraded":3,"down":1,
        "avgThroughputMbps":182.4,"worstLinkId":"…"}}
```

`telemetry` carries the whole tick's batch. `summary` is emitted at most once
every 5 s. Snapshot frames sent on first connect use the same shapes but carry
**no `id`** (they are not resumable positions).

### Error envelope

Every failure — validation, not-found, conflict, unhandled — is normalised by
`HttpExceptionFilter` to one shape. HTTP status carries the class, `code` carries
the meaning:

```json
{
  "error": {
    "code": "LINK_VERSION_CONFLICT",
    "message": "Link was modified by someone else",
    "details": { "currentVersion": 7 }
  }
}
```

`ValidationPipe` runs with `whitelist: true`, `forbidNonWhitelisted: true`,
`transform: true`, so unknown fields are rejected with `400`.

---

## 10. Common tasks

### Add a field to `Link`

1. `libs/domain/link/src/lib/link.ts` — add the property to `LinkConfig` (it
   flows into `Link` automatically). Add a value type / `LINK_LIMITS` entry if it
   is a union or has bounds.
2. `libs/data-access/links/src/lib/seed-links.ts` — give seeded links a value.
3. `apps/api/src/app/links/dto/{create,update}-link.dto.ts` — add the
   `class-validator` rules (reference `LINK_LIMITS` so client and server can't
   drift). `CreateLinkDto implements LinkConfig`, so a missing field fails to compile.
4. `apps/api/src/app/links/links.service.ts` — include it in `create()`.
5. `apps/client/src/app/fleet/link-form/link-form.component.*` — add the form
   control (validators from `LINK_LIMITS`) and the field markup. Both create and
   edit pick it up.
6. Update `fleet.component.html` if the column should show in the table.
7. Tests: `status.spec.ts` (or the relevant domain file's own spec), `link-form.component.spec.ts` for
   the control, `api.contract.spec.ts` for the round-trip.

### Add an endpoint

1. Add the method to the relevant controller under `apps/api/src/app/…`.
2. Put the logic in the matching service; keep controllers thin.
3. New request shape → a DTO in `dto/` with validators.
4. Throw `NotFoundException` / `ConflictException` with an
   `{ error: { code, message, details? } }` body so the filter passes it through.
5. Add a case to `api.contract.spec.ts`.

### Add a UI panel

1. New standalone component under `apps/client/src/app/…`, `ChangeDetectionStrategy.OnPush`.
2. Read state from a signal store; derive view state with `computed()`.
3. For a new server feed, extend `LinkStreamEvent` in the domain lib and handle
   the new `type` in `FleetStreamService` + the store.
4. Route it in `app.routes.ts` (lazy `loadComponent`).

### Add a test

- Domain rule → `libs/domain/link/src/lib/*.spec.ts` (pure, no Nest/Angular).
- Repository behaviour → `libs/data-access/links/src/lib/*.spec.ts`.
- API contract → a new `it(...)` in `apps/api/src/app/api.contract.spec.ts`.
- Store/state → `*.store.spec.ts`; component → `*.component.spec.ts`.

---

## 11. Troubleshooting

| Symptom                                          | Cause / fix                                                                                                                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Client shows no data, console 404s on `/api/*`   | API not running. Start it (`npm run start:api`) — the client proxies `/api` to `localhost:3000`.                                                                       |
| `Port 3000 is already in use`                    | Another API instance is running. Stop it, or set `PORT` in `.env`.                                                                                                     |
| `Port 4200 is already in use`                    | Stop the other Angular dev server, or `nx serve client --port 4300`.                                                                                                   |
| Telemetry never starts moving                    | The API crashed on boot — check its terminal. The simulator's first tick runs during `onModuleInit`.                                                                   |
| SSE never delivers events behind a reverse proxy | A proxy is buffering the response. Disable response buffering for `/api/stream` (e.g. nginx `proxy_buffering off;`). Not an issue with the built-in Angular dev proxy. |
| Stale UI after pulling changes                   | Kill both dev servers and restart; Angular may be serving an old bundle.                                                                                               |

---

## 12. Decisions, gaps, and next steps

### Decisions I would defend

**1. In-memory `Map` behind a `LinkRepository` port, not used directly.**
The service depends on the `LINK_REPOSITORY` token, not on `InMemoryLinkRepository`.
_Rejected:_ using the `Map` directly in the service — quicker, but it couples
domain logic to storage and a MongoDB swap would touch every method instead of
one file. Cost paid: one interface and a DI token for storage that is currently trivial.

**2. One multiplexed SSE stream with a replay buffer + connect snapshot.**
_Rejected:_ WebSockets (bidirectional we don't need, extra infra, no native
`Last-Event-ID` reconnect) and per-resource polling (wasteful at 1 Hz, no push).
_Rejected:_ `ReplaySubject(120)` — an early version replayed the buffer to _every_
new subscriber; replaced with an explicit history array so replay only happens on
reconnect and first-time clients get a purpose-built snapshot.

**3. Status is a pure function computed on read, not a stored field.**
`deriveStatus(link, latestSample, now)` lives in the domain lib and is the only
status logic in the codebase. _Rejected:_ persisting `status` and having the
simulator write it — write amplification, and the field goes stale if the
simulator lags. _Trade-off accepted:_ status is recomputed on every read.

**4. Editable fields modelled once as `LinkConfig` + `LINK_LIMITS`.**
`Link extends LinkConfig`; `CreateLinkDto implements LinkConfig`; the Angular
reactive form is typed as `LinkConfig` and its validators read `LINK_LIMITS`.
_Rejected:_ independent field lists in the domain type, both DTOs, the seed, and
the form (the original shape) — four places to keep in sync, with the compiler
unable to catch a drift. One presentational `LinkFormComponent` backs both the
create route and the edit view.

### Where this breaks at 10,000 links instead of 10

The **first bottleneck is the SSE fan-out**. Every tick the simulator emits one
array of _all_ link samples, and `StreamService` broadcasts it to _every_
connected client. At 10k links that is a ~10k-element JSON array serialised and
written per client per second, and the browser cannot render or diff 10k rows at
1 Hz. Close behind: the 120-item history buffer now retains ~1.2M sample objects,
and `InMemoryLinkRepository.findAll()` does an O(n) array copy several times per
tick and per request.
_Fixes:_ viewport-scoped telemetry subscriptions (client tells the server which
links are visible), delta encoding, server-side pagination for the list, and
per-link scheduling instead of one global tick.

### Deliberately not built

Authentication/authorization, persistence (data is lost on restart), distributed
streaming (SSE state is per-process), production observability (metrics, tracing,
alerting), and any deployment infrastructure (Docker, k8s, CI/CD) — all outside
the required scope.

Also skipped from the bonus list: B2 A2UI panel, B3 zoneless, B4 module
federation, B5 bundle-budget/perf work, B6 CI workflow, and server-side list
filtering (the client owns filter/sort so the view state can live in the URL).

### What I would do first with another day

1. B2 A2UI panel — the highest-signal bonus for this role: an untrusted
   declarative payload mapped onto a whitelisted component registry, one
   round-trip interaction, deterministic stub agent, no key required.
2. A CI workflow (lint + type-check + test + build) and one or two short ADRs.
3. Thicker component tests — a rendered-DOM interaction per screen, not just
   direct method calls.

### AI usage

Claude Code was used throughout for scaffolding, Angular/Nx/NestJS guidance,
test drafting, and this README. Every line was reviewed, run, and tested locally.

Two places I overrode the tool:

- It generated the SSE service with `ReplaySubject(120)`, which replays the full
  buffer to every new subscriber including first-time connections. I replaced it
  with an explicit `history` array + `Subject` so replay is scoped to
  `Last-Event-ID` reconnects, and first-time clients get an explicit snapshot frame.
- It wired the KPI header's up/degraded/down counts to the server `FleetSummary`.
  I kept a client-side `liveStatusCounts` computed from the live link signals
  instead, because the server summary is a 5-second snapshot and the header would
  otherwise lag the live status dots.

---
GitHub: https://github.com/basmina/linkops-console
