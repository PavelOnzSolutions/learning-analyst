**Goal** 
- Create an application used for learning distribution analysis amongst employees. 
- There are 4 different sources of data exported as CSV from 4 different systems.
- App user is able to import these 4 exports using web interface and to see a Dashboard-like interface for each import. 
- Each import is a standalone entity, there are no relations between them 

**Tech stack**
- Java 25
- Spring Boot
- React
- RadixUI
- TailwindCSS
- MongoDB

**WebUI**
- Sidebar shows four fixed top level items "New Import", "Insights", "History" and "Administration"
- Clicking on "New Import" shows a modal with basic info and 4 upload boxes (with drag/drop support), one for each file. The file roles are fixed: Completed Trainings, Training Catalog, Training Timeslots and Eployees
- After confirmation, the analysis is executed and user gets another modal with result and confirmation, if user agrees with result and wants to import the data.
- After successful import, notify the user via toast. Toast contains a link to a successful run 
- History Sidebar item shows a page with table of all analysis runs
- Clicking on a run opens a details page
- details page contains top parts with D3.js graphs relevant to app purpose, followed by data tables with info relevant to the cause - learning distribution amongst employees, employees requiring mandatory training
- The trainings have limited capacity for each slot - the app should help with scheduling trainings to avoid exceeding capacity and meeting the training requirements at the same time.

**Tech Details**
- Reuse the app skeleton already present
- Use the ../demon/demon-orchestrator (backend) and ../demon/demon-webui (frontend) as reference:
  - Simplify the login to only local user accounts
  - From Administration Sidebar menu, include only User Management, API Docs and API Tokens
  - From Navbar, keep only Theme, Accent color, Background selection (already reduced to 2 backgrounds) and user avatar menu.
- Examine the sample data and column heading names in ./sample-data in order to understand the data structure and requirements for the app
  - katalog_skoleni.csv = Trainings catalogue
  - zamestnanci.csv = Employees
  - absolvovana_skoleni.csv = Completed Trainings
  - terminy_skoleni.csv = Training Timeslots