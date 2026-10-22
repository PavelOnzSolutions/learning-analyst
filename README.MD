# Learning Analyst
Imports and analyzes trends and indicators within the exported CSV data

### Build status
[![LA - WebApp](https://github.com/PavelOnzSolutions/learning-analyst/actions/workflows/azure-static-web-apps-witty-plant-0e3e52103.yml/badge.svg)](https://github.com/PavelOnzSolutions/learning-analyst/actions/workflows/azure-static-web-apps-witty-plant-0e3e52103.yml)
[![LA - service](https://github.com/PavelOnzSolutions/learning-analyst/actions/workflows/main_app-learning-analyst-we.yml/badge.svg)](https://github.com/PavelOnzSolutions/learning-analyst/actions/workflows/main_app-learning-analyst-we.yml)

### Description

Learning Analyst helps HR/training teams track mandatory-training compliance and scheduling capacity from CSV exports of four systems: employees, training catalog, training timeslots, and completed trainings.

**Key features:**
- **New Import** — drag-and-drop upload of the 4 CSV files, with validation findings (errors/warnings) surfaced before confirming an import; a run can still be confirmed with warnings (or with errors, after an explicit confirmation).
- **History** — a paginated list of every completed import run with employee/training/timeslot/compliance counts.
- **Run Detail dashboard** — for each run: D3-powered charts (compliance by department, upcoming expirations, timeslot capacity utilization, org headcount), a filterable table of employees requiring mandatory training, and a scheduling-opportunities table matching overdue/expiring employees to upcoming timeslots with open seats.
- **Insights** — cross-run trends (compliance %, headcount, error/warning counts over time), per-employee compliance history across runs, and scheduling suggestions based on the latest completed run.
- **Administration** — local user management, API token management, and OpenAPI docs.

Each import run is a standalone, self-contained analysis; Insights is the only place data is related across runs (joined by employee ID).
