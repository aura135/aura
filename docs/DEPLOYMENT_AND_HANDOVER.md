# AURA - Final Deployment & Handover Guide

**Target Distribution**: Responsive Website + Installable Progressive Web Application (PWA) + Shared Node.js Backend  
**Notice**: In accordance with user specifications, **no APK or AAB file is generated or distributed**. Users access and install AURA directly through Google Chrome and modern browsers.

---

## 1. Project Directory Structure

```text
C:\Users\admin\.gemini\antigravity\scratch\AURA\
├── backend/                             # Shared Node.js Express REST Backend
│   ├── config/database.js               # PostgreSQL pool + persistent local store adapter
│   ├── migrations/001_initial_schema.sql# PostgreSQL DDL migrations
│   ├── middleware/                      # JWT auth, rate limiter, input validators
│   ├── routes/                          # Auth, Notes, Tasks, Reminders, Alarms, Sync...
│   ├── test/                            # Integration test suites (backend.test.js, sync.test.js)
│   ├── .env.example                     # Environment variables template
│   ├── package.json                     # Node.js dependencies
│   └── server.js                        # Express server entry point (Port 4000)
├── web/                                 # Modern Responsive Website + Installable PWA
│   ├── public/
│   │   ├── manifest.webmanifest         # PWA Manifest (id: "/", standalone, icons, shortcuts)
│   │   ├── sw.js                        # Production Service Worker (offline cache, push alerts)
│   │   └── icons/                       # Maskable SVG/PNG application icons
│   ├── src/
│   │   ├── components/                  # GlowingOrb, StrictVoiceControls, Navbar, PWAInstallBanner
│   │   ├── services/                    # api.js (offline sync), voiceEngine.js (multilingual TTS/STT)
│   │   ├── views/                       # 14 Complete Pages (Landing, Assistant, Notes, Tasks...)
│   │   ├── App.jsx                      # Main application shell & router
│   │   └── main.jsx                     # Entrypoint
│   ├── dist/                            # Production pre-built web assets (ready to deploy)
│   ├── vite.config.js                   # Vite configuration with /api proxy
│   └── package.json                     # Web dependencies
├── app/                                 # Preserved Kotlin Android Studio Project (Benchmark)
│   ├── src/main/java/com/aura/assistant/# Preserved Kotlin architecture + AuraApiClient.kt
│   └── build.gradle.kts                 # Android Gradle configuration
└── docs/                                # Complete ecosystem documentation
    ├── API_DOCUMENTATION.md
    ├── INSTALLATION_AND_TESTING_REPORT.md
    └── DEPLOYMENT_AND_HANDOVER.md
```

---

## 2. Step-by-Step Local Execution Commands

### Step 2.1: Start the Supporting Backend
Open a terminal and run:
```powershell
# Navigate to backend
cd "C:\Users\admin\.gemini\antigravity\scratch\AURA\backend"

# (Optional) If you have a live PostgreSQL database, configure DATABASE_URL:
# $env:DATABASE_URL = "postgres://postgres:password@localhost:5432/aura_db"

# Start the Express server
npm start
```
*The server will launch at `http://localhost:4000`.*  
*Health Check: `http://localhost:4000/api/health`*

### Step 2.2: Run the Backend Integration Tests
To verify all 12 endpoints and multi-client cross-platform synchronization:
```powershell
cd "C:\Users\admin\.gemini\antigravity\scratch\AURA\backend"
npm test
node test/sync.test.js
```

### Step 2.3: Start the Responsive Website in Development Mode
In a second terminal window:
```powershell
cd "C:\Users\admin\.gemini\antigravity\scratch\AURA\web"
npm run dev
```
*Open Google Chrome at `http://localhost:3000`.*

### Step 2.4: Preview the Production Website & PWA Build
```powershell
cd "C:\Users\admin\.gemini\antigravity\scratch\AURA\web"
npm run preview
```
*The pre-built production bundle in `dist/` will serve at `http://localhost:4173`.*

---

## 3. How to Install AURA as a PWA (No APK Required)

### On Android (Chrome):
1. Open Google Chrome on your Android smartphone.
2. Navigate to your deployed AURA URL (or local IP with HTTPS: `https://<ip>:3000`).
3. Either tap the **"Install App"** button on the AURA top banner, or tap Chrome's menu (`⋮`) and select **"Add to Home screen"** or **"Install app"**.
4. Confirm installation. AURA will be placed in your Android app drawer with its native icon and opens as a standalone fullscreen app without browser address bars!

### On Desktop (Chrome / Edge):
1. Open Chrome or Edge and visit the AURA website.
2. Look at the right side of the address bar for the **Install App icon** (or click the in-app "Install App" banner).
3. Click **Install**. AURA will open in an isolated desktop window and appear in your OS Start Menu / Taskbar.

---

## 4. Configuring PostgreSQL Database

If you wish to run a dedicated PostgreSQL server:
1. Create a database:
```sql
CREATE DATABASE aura_db;
```
2. Apply the schema migration:
```bash
psql -U postgres -d aura_db -f "backend/migrations/001_initial_schema.sql"
```
3. Set the environment variable in `backend/.env`:
```ini
DATABASE_URL=postgres://postgres:yourpassword@localhost:5432/aura_db
```
*(If `DATABASE_URL` is omitted, the backend automatically runs with its built-in JSON/file persistence adapter without throwing errors).*

---

## 5. Deploying to Production Cloud Platforms

### 5.1 Deploying the Website / PWA:
The `web/dist` folder contains the production-compiled static bundle (`index.html`, `manifest.webmanifest`, `sw.js`, `assets/`, `icons/`).
- **Vercel / Netlify / Cloudflare Pages**:
  - Root directory: `web`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Ensure HTTPS is enabled (required for Service Worker & Web Speech).

### 5.2 Deploying the Backend:
- **Render / Railway / Fly.io / AWS ECS**:
  - Root directory: `backend`
  - Start command: `node server.js`
  - Environment variables:
    - `PORT`: `4000`
    - `DATABASE_URL`: `postgres://user:pass@host:5432/aura_db`
    - `JWT_SECRET`: `your_random_production_secret_key`
    - `CORS_ORIGIN`: `https://your-aura-website.vercel.app`

---

## 6. Testing Cross-Platform Synchronization

1. Open AURA in Chrome on desktop, register an account (e.g. `commander@aura.ai`), and create a note with 3 ordered points in the **Notes & Points** screen.
2. Open AURA on mobile Chrome or installed PWA, log in with the same email.
3. The note and ordered points immediately appear on the mobile screen.
4. Add a task on mobile ("Buy groceries").
5. Refresh or tap "Sync Cloud" on desktop: the task synchronizes seamlessly.
