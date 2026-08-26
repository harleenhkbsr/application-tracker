# Application Tracker

A job application tracker with a Node/Express + SQLite backend and a React (Vite) frontend.

## Stack

- Frontend: React (Vite) + Tailwind CSS v4
- Backend: Node.js + Express
- Database: SQLite via Node's built-in `node:sqlite` module

## Setup

**1. Backend**

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:4000`. A `tracker.db` file is created automatically on first run. You'll see an `ExperimentalWarning` about SQLite on startup — that's expected, not an error.

**2. Frontend** (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`. Both servers need to be running — the frontend proxies `/api/*` calls to the backend.

Open `http://localhost:5173` in your browser.

## How to use it

**Add an application**
Click **Add application** in the top right. Fill in company and role (required), then optionally the status, date applied, a link to the posting, and notes. Click **Add to log**.

**Edit an application**
Click the pencil icon on any card. Change any field and click **Save changes**. This is how you move an application through stages — open it and change the Status dropdown as things progress (e.g. from Applied to Screening once you hear back).

**Delete an application**
Click the trash icon on a card. This is immediate — there's no confirmation step or undo.

**Search and filter**
The search box filters by company or role name as you type. The dropdown next to it filters by status. Both apply together.

**Reading the status pipeline**
Each card shows a strip of segments — Applied, Screening, Interview, Offer — filled in up to the application's current stage. If an application is Rejected, the strip dims and shows a "CLOSED" tag instead, regardless of which stage it reached.

**Stats bar**
Top right shows: total applications logged, active (everything not Rejected), interviewing+ (Interview or Offer stage), and response rate (percentage that moved past Applied).

## API reference

| Method | Route                   | Description           |
| ------ | ----------------------- | --------------------- |
| GET    | `/api/applications`     | List all applications |
| POST   | `/api/applications`     | Create an application |
| PUT    | `/api/applications/:id` | Update an application |
| DELETE | `/api/applications/:id` | Delete an application |
| GET    | `/api/stats`            | Summary counts        |

Body shape for POST/PUT:

```json
{
  "company": "Acme Co",
  "role": "Backend Engineer",
  "status": "Applied",
  "dateApplied": "2026-08-01",
  "link": "https://...",
  "notes": "Referred by a friend"
}
```

`status` must be one of: `Applied`, `Screening`, `Interview`, `Offer`, `Rejected`.
