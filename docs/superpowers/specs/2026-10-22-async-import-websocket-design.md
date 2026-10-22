# Async Import with WebSocket Progress — Design

Date: 2026-10-22

## Problem

The import endpoint (`POST /api/v1/runs`) is fully synchronous today: the HTTP request thread reads 4 multipart CSV files, parses them, runs 4 analyzers, computes compliance, and saves everything to Mongo before returning. For larger files this blocks the browser tab on a single long-running request with no feedback beyond a static "Uploading..." button state.

This design makes the import asynchronous: the API returns immediately once the job is accepted, and the backend pushes progress over a WebSocket as the job advances through its phases, ending in `COMPLETED` or `FAILED`.

## Current state (as of this design)

- `RunController.createRun` (`analyst-service/src/main/java/solutions/onz/muni/learning/api/RunController.java`) — `POST /api/v1/runs`, multipart (`name` + 4 files), returns `201` + full `RunResponse` synchronously.
- `RunService.createRun` (`.../service/RunService.java`) — parses all 4 files via `CsvIngestionService`, runs `EmployeeAnalyzer`/`TrainingCatalogAnalyzer`/`TimeslotAnalyzer`/`CompletedTrainingAnalyzer`, computes compliance via `TrainingComplianceService`, saves `ImportRun` (status `PENDING_REVIEW`) + child row collections to Mongo. All in-request-thread, no `@Async`.
- `RunStatus` enum: `PENDING_REVIEW`, `COMPLETED` only.
- No async infra (`@Async`/`TaskExecutor`) anywhere in `analyst-service`.
- `spring-boot-starter-websocket` is on the classpath (via `buildSrc` convention plugin) but unused — no `WebSocketConfig`, no STOMP/SockJS setup.
- Frontend (`analyst-webui`, React + TanStack Query): `NewImportModal.tsx` POSTs the form, blocks on the response via `useMutation`, then opens `ImportResultModal.tsx` with the already-computed `RunResponse`. No WebSocket client code exists.
- Persistence is Spring Data MongoDB (not JPA); domain classes live under `domain/`, repositories under `repository/`.

## Requirements (from brainstorming)

- Notification payload: status + phase-level progress updates (not row-level counts, not the full result embedded in the WS message).
- Multiple imports can run concurrently; each needs its own channel (no cross-talk between jobs).
- Any authenticated user may subscribe to any run's progress topic (matches today's un-restricted `GET /runs/{id}`); no per-run ownership check.
- Background work should run on a small bounded thread pool, not unbounded threads — protects Mongo/CPU from bursts of large imports.
- Mechanism: STOMP over WebSocket with SockJS fallback, using Spring's built-in simple in-memory broker (no new message-broker dependency).

## Design

### Data model changes

`domain/enums/RunStatus.java`: add `PROCESSING`, `FAILED` (existing: `PENDING_REVIEW`, `COMPLETED`).

`domain/ImportRun.java`: add
- `currentPhase` — new enum `ImportPhase { PARSING_EMPLOYEES, PARSING_TRAINING_CATALOG, PARSING_TIMESLOTS, PARSING_COMPLETED_TRAININGS, ANALYZING_COMPLIANCE, SAVING_RESULTS, DONE }`
- `errorMessage` — nullable `String`, populated only when status is `FAILED`.

### API contract

`POST /api/v1/runs` keeps its multipart signature (`name` + 4 files). New behavior:

1. Read each `MultipartFile`'s bytes into `byte[]` synchronously, in the request thread. This is required: the `MultipartFile`'s backing temp storage is invalidated once the HTTP request completes, so bytes must be captured before handing off to the async thread.
2. Synchronously create and persist the `ImportRun` doc with `status = PROCESSING`, `currentPhase = PARSING_EMPLOYEES`. This produces the `id` the client subscribes with.
3. Dispatch `RunService.processImportAsync(runId, employeeBytes, trainingCatalogBytes, timeslotBytes, completedTrainingBytes, createdBy)` to the async executor.
4. Return `202 Accepted` with a new DTO `AsyncImportResponse { id, status }`.

`GET /api/v1/runs/{id}` and `GET /api/v1/runs/{id}/detail` are unchanged — the frontend uses these to fetch the full result once it learns (via WebSocket) that the job finished. The full result is never pushed over the WebSocket.

### Async execution

- New `@Configuration` class registers a dedicated `ThreadPoolTaskExecutor` bean (`importTaskExecutor`): core pool 2, max pool 4, bounded queue capacity ~20. `@EnableAsync` on the application or a config class.
- `RunService.processImportAsync(...)` is annotated `@Async("importTaskExecutor")`, returns `void`. It runs the existing parse → analyze → compute-compliance → save pipeline. After each existing step completes, it updates `ImportRun.currentPhase` in Mongo and publishes a progress event (see WebSocket section).
- On success: status → `PENDING_REVIEW` (unchanged from today), `currentPhase = DONE`, publishes a final `COMPLETED` event.
- On any exception: caught inside `processImportAsync`, sets `status = FAILED` and `errorMessage = <exception message>`, saves, and publishes a final `FAILED` event. The exception must not propagate out of the `@Async` method uncaught (it would otherwise just be logged by Spring's default `AsyncUncaughtExceptionHandler` and the client would never learn the job failed).

### WebSocket (STOMP + SockJS)

- New `WebSocketConfig implements WebSocketMessageBrokerConfigurer`, annotated `@EnableWebSocketMessageBroker`.
  - STOMP endpoint registered at `/ws`, with `.withSockJS()` fallback.
  - Simple broker enabled on `/topic` (no external broker dependency).
- Auth: handshake/connect reuses the existing OAuth2 resource-server validation (bearer token passed as a STOMP CONNECT header or query param, validated the same way as HTTP requests). Any authenticated user may subscribe to any topic — no per-run ownership check.
- Topic naming: `/topic/runs/{runId}/progress`, one topic per job — gives per-job isolation for concurrent imports without needing a message broker with routing keys.
- Message payload (new DTO, e.g. `RunProgressEvent`):
  ```
  { status: PROCESSING | COMPLETED | FAILED, phase: <ImportPhase | null>, errorMessage: <string | null> }
  ```
- **Snapshot-on-subscribe**: an event listener on `SessionSubscribeEvent` for `/topic/runs/{runId}/progress` looks up the current `ImportRun` state and sends it directly to the newly-subscribed session as its first message. This covers subscribe-after-phase-already-passed races and reconnects — the client never has to guess whether it missed an update.

### Frontend (analyst-webui)

New dependencies: `sockjs-client`, `@stomp/stompjs`.

- `NewImportModal.tsx`: submit mutation now expects `202` + `AsyncImportResponse{id, status}`. On success, hands the `id` off to a progress view instead of opening `ImportResultModal` directly.
- New `useImportProgress(runId)` hook: opens a STOMP client over SockJS to `/ws` (same auth-token attachment pattern as `fetchWithAuth`), subscribes to `/topic/runs/{runId}/progress`, exposes `{ status, phase, errorMessage }` as React state. Unsubscribes/disconnects on unmount.
- New `ImportProgressModal.tsx`: replaces the static "Uploading..." state with a step indicator driven by `useImportProgress`, showing phases in order.
- On `status === COMPLETED`: fetch `GET /v1/runs/{id}/detail` (existing query), then show today's unchanged `ImportResultModal` (confirm/reject flow untouched).
- On `status === FAILED`: show `errorMessage` in the progress modal with a "Close" action. No automatic retry — user re-opens `NewImportModal` to try again.
- Resilience: `@stomp/stompjs` auto-reconnects on WS drop; snapshot-on-subscribe means a reconnect immediately yields current state rather than a stale one.

## Testing

- `RunServiceTest`: success path asserts phase transitions ending in `COMPLETED`/`PENDING_REVIEW`; failure path (e.g. malformed CSV) asserts `FAILED` + `errorMessage`, and that exceptions don't escape the `@Async` method.
- Controller test: `POST /runs` asserts `202` + `AsyncImportResponse` instead of the old `201` + `RunResponse`.
- New WebSocket integration test using Spring's STOMP test client (`WebSocketStompClient`): kick off an import, subscribe to the run's topic, assert the ordered sequence of phase events ending in `COMPLETED`; repeat for the failure case asserting a `FAILED` event with a message.
- Frontend: update existing `NewImportModal`/`ImportResultModal` tests for the new 202 contract and intermediate progress modal; add a unit test for `useImportProgress` with a mocked STOMP client covering state transitions and cleanup-on-unmount.

## Rollout

- Single deploy — backend and frontend ship together since this changes the `POST /api/v1/runs` response contract (202 vs 201).
- No data migration: `RunStatus` only gains enum values; existing `PENDING_REVIEW`/`COMPLETED` runs are unaffected.
- Implementation-time check: any reverse proxy/ingress in front of analyst-service must allow WebSocket upgrade on `/ws`.
- Known limitation: the simple in-memory STOMP broker does not deliver messages across multiple backend instances. Fine for the current single-instance deployment; would need a broker relay (e.g. RabbitMQ `enableStompBrokerRelay`) if analyst-service is ever horizontally scaled.
