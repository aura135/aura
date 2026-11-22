# AURA Backend REST API

This lightweight Express.js server provides supporting cloud synchronization and backup restoration for the AURA Android application.

## Endpoints

### 1. Health Check
- **`GET /api/health`**
- Returns server operational status and timestamp.

### 2. Notes Synchronization
- **`POST /api/sync/notes`**
- Body: `{ "notes": [ { "id": 1, "title": "Meeting", "points": [...] } ] }`

### 3. Reminders Synchronization
- **`POST /api/sync/reminders`**
- Body: `{ "reminders": [ ... ] }`

### 4. Tasks Synchronization
- **`POST /api/sync/tasks`**
- Body: `{ "tasks": [ ... ] }`

### 5. Pull Updates
- **`GET /api/sync/pull?since=<timestamp>`**
- Returns all newly synchronized records since the given timestamp.

## Getting Started

```bash
npm install
npm start
```
Default port is `4000`. Set `PORT=XXXX` in environment variables if desired.
