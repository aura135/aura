# AURA AI Personal Assistant - API Documentation

**Version**: 2.0.0  
**Base URL**: `http://localhost:4000/api`  
**Authentication**: Bearer Token (`Authorization: Bearer <token>`)

---

## 1. System Health

### `GET /api/health`
Returns the operational health and active capabilities of the AURA backend.
- **Auth**: None
- **Response**:
```json
{
  "status": "ONLINE",
  "service": "AURA AI Personal Assistant Shared Backend",
  "version": "2.0.0",
  "timestamp": "2026-11-22T04:30:00.000Z",
  "features": [
    "JWT Authentication & Multi-Tenancy",
    "PostgreSQL Relational DB Storage",
    "Notes & Ordered Points Engine",
    "Tasks & Reminders Scheduling",
    "Free-Time Window Reminders",
    "Device Registration & Presence",
    "Command History Audit Log",
    "Unified Cross-Platform Sync"
  ]
}
```

---

## 2. Authentication

### `POST /api/auth/register`
Creates a new user account across Web, PWA, and Android.
- **Body**:
```json
{
  "email": "user@aura.ai",
  "password": "securePassword123",
  "full_name": "Commander Alex",
  "preferred_language": "en" // "en" | "te" | "hi"
}
```
- **Response (201 Created)**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": {
    "id": 1,
    "email": "user@aura.ai",
    "full_name": "Commander Alex",
    "preferred_language": "en"
  }
}
```

### `POST /api/auth/login`
Authenticates a user and returns a 30-day JWT.
- **Body**:
```json
{
  "email": "user@aura.ai",
  "password": "securePassword123"
}
```

### `GET /api/auth/me`
Retrieves authenticated user profile.
- **Auth**: Required

---

## 3. Notes & Ordered Points

### `GET /api/notes`
Retrieves all notes for the authenticated user, including their nested ordered points (`point_order = 1, 2, 3...`).
- **Auth**: Required

### `POST /api/notes`
Creates a new note with ordered points.
- **Body**:
```json
{
  "title": "Sprint Roadmap",
  "category": "Work",
  "points": [
    "Complete architecture review",
    "Implement Service Worker offline cache",
    "Run end-to-end synchronization tests"
  ]
}
```

### `POST /api/notes/:id/points`
Appends an ordered point to an existing note.
- **Body**:
```json
{
  "point_text": "Verify Web Media Session audio playback",
  "point_order": 4
}
```

### `DELETE /api/notes/:id`
Deletes a note and all its ordered points.

---

## 4. Tasks

### `GET /api/tasks`
Lists all tasks for the authenticated user.

### `POST /api/tasks`
Creates a task.
- **Body**:
```json
{
  "title": "Review AURA Test Coverage",
  "description": "Ensure 100% test pass on sync",
  "due_date": 1732280000000
}
```

### `PATCH /api/tasks/:id/complete`
Toggles task completion status.

### `DELETE /api/tasks/:id`
Deletes task.

---

## 5. Reminders & Free-Time Windows

### `GET /api/reminders`
Lists all scheduled reminders.

### `POST /api/reminders`
Schedules an exact or free-time reminder.
- **Body (Exact Reminder)**:
```json
{
  "title": "Call Rahul",
  "reminder_time": 1732298400000,
  "is_free_time": false
}
```
- **Body (Free-Time Window Reminder)**:
```json
{
  "title": "Review saved points",
  "reminder_time": 1732298400000,
  "is_free_time": true,
  "free_time_start": "6 PM",
  "free_time_end": "8 PM"
}
```

---

## 6. Alarms

### `GET /api/alarms`
Lists all alarms.

### `POST /api/alarms`
Creates an alarm.
- **Body**:
```json
{
  "hour": 6,
  "minute": 30,
  "label": "Morning Wakeup"
}
```

---

## 7. Cross-Platform Sync

### `POST /api/sync/push`
Batch pushes entities from Android, Web, or PWA into cloud storage.
- **Body**:
```json
{
  "notes": [...],
  "reminders": [...],
  "tasks": [...]
}
```

### `GET /api/sync/pull?since={timestamp}`
Pulls all synced notes, reminders, and tasks updated since timestamp.
