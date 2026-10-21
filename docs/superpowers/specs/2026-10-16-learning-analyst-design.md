# Learning Analyst — Design

Date: 2026-10-16

## 1. Goal

A web application for analyzing learning/training distribution among employees. Users import four CSV exports (Completed Trainings, Training Catalog, Training Timeslots, Employees) from four different source systems. Each import ("run") is analyzed for data-quality issues, reviewed by the user, and — once confirmed — produces a dashboard of compliance, capacity, and scheduling insights. Each run is an independent snapshot; there are no live relations between runs for analysis purposes, though a separate cross-run Insights view is allowed to join employees by business key for trend reporting (see §7).

## 2. Tech Stack

- Backend: Java 25, Spring Boot (Spring Data MongoDB, virtual threads enabled), MongoDB.
- Frontend: React, RadixUI, TailwindCSS, D3.js for charts.
- Both `analyst-service` and `analyst-webui` already exist as a skeleton copied from the `demon` reference project (`../demon/demon-orchestrator`, `../demon/demon-webui`) and need to be trimmed down and repurposed, not rebuilt from scratch.

## 3. Architecture

### 3.1 Backend layering

`controller → service → repository`, standard Spring Data MongoDB repositories. Key services:

- **CsvIngestionService** — per file role, detects delimiter (`,` vs `;`) by sniffing the header row, and detects encoding (UTF-8 vs Windows-1250) by attempting UTF-8 decode first and falling back to CP1250 if replacement characters appear. Produces typed row records.
- **SanitizationService** — trims whitespace, collapses internal multi-spaces, and neutralizes spreadsheet-formula-injection in free-text fields (values starting with `=`, `+`, `-`, `@` get a leading `'` stripped/neutralized before storage). Numeric/date fields are parsed and typed rather than treated as text, so a value like `-600,00` becomes the number `-600.00` (flagged as a negative-price warning) rather than being treated as a formula.
- **ImportAnalysisService** — runs field-level validation rules (§4), classifying every finding as `ERROR` (blocks confirmation) or `WARNING` (informational, does not block).
- **TrainingComplianceService** — computes, per active employee, which trainings are mandatory and their compliance status (§4.3).
- **RunService** — orchestrates the analyze → persist-draft → confirm/reject lifecycle (§5).
- **InsightsService** — reads across all `COMPLETED` runs and joins `run_employees` by `id_zamestnance` to build cross-run trend data (§7).

### 3.2 MongoDB collections

- `import_runs`: `_id`, `name`, `status` (`PENDING_REVIEW` | `COMPLETED`), `createdAt`, `confirmedAt`, `createdBy`, summary counts, and the full analysis result (ordered list of findings, each with `severity`, `file`, `row`, `field`, `message`).
- `run_employees`, `run_training_catalog`, `run_timeslots`, `run_completed_trainings`: parsed + sanitized rows, each tagged with `runId`. Scoped per-run (not deduplicated/merged across runs) — except `run_employees.id_zamestnance` is indexed so `InsightsService` can join across runs without per-run analysis depending on any other run.
- `rodne_cislo` is never persisted in full — only the last 4 characters are stored (`rodneCisloMasked`); the rest is discarded at ingestion time and never logged or returned by any API.
- `users`: local accounts — `username`, `passwordHash`, `role`, `createdAt`. No OAuth2/Microsoft fields (dropped from the reused `demon-orchestrator` auth model).

### 3.3 Frontend structure

Reused from the `demon` skeleton, with all `demon`-specific domain content removed:

- **Removed entirely**: SRE/Operations/Knowledge Base/Tasks/Sandbox pages and routes, the notifications bell + `WebSocketContext`, the language switcher + locale-fetch query, the Microsoft/OAuth2 login path and its callback route, the session-expiry countdown ring (no token-refresh UI needed if sessions are simple JWT with normal expiry — kept minimal).
- **Kept**: layouts (`MainLayout`, `AuthLayout`, `ErrorLayout`), `AuthContext` (local-login only), `ThemeContext`, `ToolbarContext`, `PageTitleContext`, `TokenStore`, Radix + Tailwind setup, i18n scaffolding (but no language switcher UI exposed).
- **New pages**: `NewImportModal`, `HistoryList`, `RunDetail` (charts + tables), `Insights` (cross-run trends), trimmed `Administration` (Users, API Docs, API Tokens, **Configuration**).
- **Sidebar** (fixed top-level items): New Import (opens modal), Insights, History, Administration (Users / API Docs / API Tokens / Configuration).

#### 3.3.1 Administration → Configuration (Import Settings)

Mirrors `demon-webui`'s `ConfigurationPage` shape (header + `Tabs.Root`), but scoped down to what this app needs: a single **Import Settings** tab/card, not the AI/MCP/Audit tabs from `demon`. For each of the 4 file roles (Completed Trainings, Training Catalog, Training Timeslots, Employees), a `Select` for delimiter (`Auto` / `,` / `;` / Tab / `|`) with a Save button, following the same "fetch current config via query → local state → PUT on save" pattern as `demon-webui`'s `GeneralSettingsTab`.

Backend: a `ImportSettings` singleton document (one row, like `demon-orchestrator`'s `TaskWatchdogConfig` pattern) with a map of file role → delimiter setting, exposed via `ImportSettingsController` (`GET`/`PUT /api/v1/admin/import-settings`), read by `CsvIngestionService` at analysis time (§4.1).
- **Navbar**: Theme toggle, Accent color picker, Background picker (existing 2 backgrounds), avatar menu (Profile / Settings / Logout). Nothing else.

## 4. CSV Ingestion & Analysis Rules

### 4.1 Per-file parsing

| File role | Expected delimiter (sniffed by default) | Expected encoding (detected, not assumed) |
|---|---|---|
| Training Catalog (`katalog_skoleni.csv`) | `,` | UTF-8 |
| Employees (`zamestnanci.csv`) | `,` | UTF-8 |
| Training Timeslots (`terminy_skoleni.csv`) | `;` | UTF-8 |
| Completed Trainings (`absolvovana_skoleni.csv`) | `;` | Windows-1250 (fallback) |

By default the app does not hard-code delimiter per role — it sniffs the header row of each uploaded file. An admin can override this per role from **Administration → Configuration → Import Settings** (§3.3.1): each of the 4 file roles gets a delimiter setting of `Auto` (sniff, default), `,`, `;`, `\t`, or `|`. When a role's setting is not `Auto`, `CsvIngestionService` uses it directly and skips sniffing for that role; a delimiter mismatch against the actual file content (e.g. configured as `,` but the file is clearly `;`-delimited, producing a single-column parse) is reported as a WARNING rather than silently failing. Encoding remains auto-detected only (not configurable), since the spec only called out delimiter configuration.

### 4.2 Field-level validation rules

| Field | Rule | Severity |
|---|---|---|
| Dates (`datum_*`, `platnost_do`, `datum_nastupu`, `datum_ukonceni`) | Accept ISO `YYYY-MM-DD`, `D. M. YYYY`, `DD.MM.YYYY`. Calendar-invalid dates (e.g. `31. 9. 2026`) | ERROR on that row |
| `kod_skoleni` reference | Must match a catalogue entry. Case-insensitive match succeeds but is flagged | WARNING (case mismatch) / ERROR (no match at all) |
| `id_zamestnance` reference | Must match an employee row | ERROR if unresolvable |
| Duplicate rows (identical business key, e.g. same `id_zaznamu` or same employee+training+date) | First occurrence kept, rest dropped | WARNING |
| `kapacita`/`obsazeno` | `obsazeno > kapacita` (overbooked), or `kapacita = 0` on a non-cancelled slot | WARNING |
| Prices (`cena_*`, `cena_na_osobu`) | Non-numeric text (currency suffix, thousands separator) parsed by stripping non-digit characters; negative value after parsing | WARNING (negative) |
| `email` | Malformed (space before `@`, missing TLD, stray punctuation) | WARNING |
| `rodne_cislo` | Format-checked (9 or 10 digit Czech birth-number pattern with optional slash), then masked to last 4 characters before persistence regardless of validity | WARNING if malformed, always masked |
| Unparseable row (missing required column, structurally broken) | Row excluded from all downstream counts/analysis | ERROR |
| `povinne_pro` department/position references (`UTVAR:x`, `POZICE:x`) that don't match any value actually present in the Employees file (diacritics/case-insensitive match) | WARNING |

A run with zero ERRORs can be confirmed regardless of WARNING count. A run with one or more ERRORs can still be confirmed, but the UI requires an explicit second confirmation step acknowledging the errors first (§5, step 3) — the backend does not block confirmation on ERROR findings; it is purely a UI guardrail. Confirming with ERRORs present does not change what analysis already decided to persist — rows excluded during analysis (e.g. a row missing its required key field, or an entire file that failed to parse or was missing a required column) remain excluded either way; every row that WAS kept is persisted exactly as parsed, with its ERROR-flagged field(s) intact.

### 4.3 Mandatory-training compliance

For each **active** employee (`stav` is not the terminated value `ukončen` — observed values are `aktivní`, `ukončen`, `rodičovská`; only `ukončen` excludes an employee from compliance counts, since someone on parental leave is still employed and should still show as needing training once back), evaluate every catalogue entry's `povinne_pro`:

- `VSICHNI` → applies to all active employees.
- `UTVAR:x;y` (semicolon-separated) → applies if the employee's `utvar` matches one listed, using diacritic/case-insensitive comparison (so `Studijni oddeleni` and `Studijní oddělení` are treated as the same department for this purpose, while still being flagged as a data-quality warning per §4.2).
- `POZICE:x` → applies if `pozice` matches, same comparison rules.
- `NEPOVINNE` → excluded from compliance calculations entirely.

For each applicable (employee, training) pair, find the most recent matching row in Completed Trainings. Compute an expiry date: prefer `platnost_do` if present and parseable; otherwise derive from `datum_absolvovani` + the catalogue's `platnost_mesicu` (parsed as an integer number of months; non-numeric values like `"2 roky"` are parsed as best-effort — `"N roky"/"N let"/"N rok"` → `N * 12` months — and flagged as a WARNING for non-standard formatting; a blank `platnost_mesicu` with a non-`NEPOVINNE` `povinne_pro` means "never expires" for that training).

Status buckets: **compliant** (expiry > 60 days out), **expiring soon** (expiry within 60 days), **overdue** (expiry in the past, or training never completed at all).

## 5. Import Flow (API + UI)

1. **New Import** modal: name/label field + 4 fixed drag/drop upload boxes (role fixed by box position: Completed Trainings, Training Catalog, Training Timeslots, Employees — never inferred from filename).
2. `POST /api/v1/runs` (multipart, 4 files + name) → backend runs ingestion, sanitization, analysis, and compliance computation, then persists everything immediately as an `import_runs` document with `status = PENDING_REVIEW` plus its associated `run_*` rows. Returns the full analysis result (counts + ERROR/WARNING list).
3. Frontend shows a second modal with the result: parsed counts, Errors (if any), Warnings, and **Confirm** / **Reject** actions.
   - If there are ERRORs, clicking Confirm first shows a warning dialog ("This run has N error(s). Confirming will import the data as currently parsed. Rows that failed to parse are not included. Are you sure?") requiring an explicit second confirmation before the actual confirm call is made. If there are no ERRORs, Confirm proceeds immediately.
4. **Confirm** → `POST /api/v1/runs/{id}/confirm` → always succeeds for a `PENDING_REVIEW` run regardless of ERROR findings (the backend does not reject on error count — see §4.2) → status becomes `COMPLETED` → toast notification, navigating to `/history` (the list page); a direct link to `/history/{id}` (the run's detail page) is deferred to Phase 4, which is when `RunDetail` is implemented.
5. **Reject** → `DELETE /api/v1/runs/{id}` → the draft run and its `run_*` rows are deleted outright.

## 6. History & Run Detail

**History** (`/history`): table of all `COMPLETED` runs — name, date, employee/training/timeslot counts, warning count. Row click → Run Detail.

**Run Detail** (`/history/{id}`): four D3 charts, then data tables.

Charts:
1. Compliance by department/training — grouped/stacked bars of compliant vs expiring vs overdue counts.
2. Upcoming expirations timeline — histogram of completions expiring in the next 30/60/90+ days.
3. Timeslot capacity utilization — per upcoming timeslot, booked vs capacity, with overbooked/cancelled/zero-capacity slots visually flagged.
4. Org structure/headcount breakdown — employee counts by department and position.

Tables:
- **Employees requiring mandatory training** — filterable by status (overdue / expiring / compliant), one row per (employee, required training) pair.
- **Scheduling opportunities** — cross-references overdue/expiring employees against upcoming timeslots for the matching training code that still have open seats, to directly support the spec's capacity-planning requirement. Read-only: the app surfaces the match, it does not create an assignment record (see §8 — explicitly out of scope).

## 7. Insights (cross-run)

`/insights`: trend view built only from `COMPLETED` runs.

- Run-level trend charts: overall compliance %, active headcount, and ERROR/WARNING counts, one point per run over time.
- Per-employee history: `InsightsService` joins `run_employees` across runs by `id_zamestnance` to show how an individual's training compliance has changed run over run. This is the one place in the app where data from different runs is related to each other; it does not affect how any individual run is analyzed, validated, or displayed in History.

## 8. Explicitly Out of Scope

- No scheduling actions (no assigning employees to timeslots, no editing imported data) — the app is read-only analytics on top of each import.
- No public self-registration — accounts are admin-managed only (seeded default admin + User Management screen).
- No Microsoft/OAuth2 login — local accounts only.
- No cross-run joins other than the Insights employee-history view described in §7.

## 9. Security Notes

- `rodne_cislo` (Czech national ID) is masked at ingestion — only the last 4 characters are ever persisted or returned by any API; the full value is discarded in memory after the format check.
- CSV cell values are sanitized against spreadsheet-formula-injection (`=`, `+`, `-`, `@` prefixes neutralized in free-text fields) before storage or rendering, since source files contain exactly this kind of payload (`=HYPERLINK(...)`, `@SUM(1+1)`) in notes fields.
- Auth mirrors `demon-orchestrator`'s local JWT login/refresh/logout, with the Microsoft OAuth2 path removed.

## 10. Testing Approach

- Backend: unit tests for `CsvIngestionService` (delimiter/encoding detection), `SanitizationService` (formula-injection neutralization), `ImportAnalysisService` and `TrainingComplianceService` (rule tables in §4, driven directly off fixtures derived from the real `sample-data/*.csv` quirks), and integration tests for the full analyze→confirm→reject lifecycle against an embedded/test MongoDB.
- Frontend: component tests for the New Import flow (error-blocks-confirm behavior) and the Run Detail charts/tables rendering against fixture data.
