-- AURA AI Personal Assistant Database Schema
-- Compatible with PostgreSQL 12+

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    avatar_url TEXT DEFAULT '',
    preferred_language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Devices Table (Android, Web, PWA)
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_name VARCHAR(120) NOT NULL,
    device_type VARCHAR(50) NOT NULL, -- 'android', 'web', 'pwa'
    push_token TEXT DEFAULT '',
    user_agent TEXT DEFAULT '',
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

-- 3. Notes Table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(80) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);

-- 4. Note Points Table (Ordered Points)
CREATE TABLE IF NOT EXISTS note_points (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    point_text TEXT NOT NULL,
    point_order INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_note_points_note ON note_points(note_id);
CREATE INDEX IF NOT EXISTS idx_note_points_order ON note_points(note_id, point_order);

-- 5. Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    is_completed BOOLEAN DEFAULT FALSE,
    due_date BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);

-- 6. Reminders Table (Supporting Free-Time Windows)
CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    reminder_time BIGINT NOT NULL,
    repeat_type VARCHAR(50) DEFAULT 'NONE',
    is_free_time BOOLEAN DEFAULT FALSE,
    free_time_start VARCHAR(50) DEFAULT '',
    free_time_end VARCHAR(50) DEFAULT '',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);

-- 7. Alarms Table
CREATE TABLE IF NOT EXISTS alarms (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hour INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    label VARCHAR(120) DEFAULT 'AURA Alarm',
    days_of_week VARCHAR(100) DEFAULT 'DAILY',
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alarms_user ON alarms(user_id);

-- 8. User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pref_key VARCHAR(100) NOT NULL,
    pref_value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_pref UNIQUE(user_id, pref_key)
);

CREATE INDEX IF NOT EXISTS idx_preferences_user ON user_preferences(user_id);

-- 9. Command History Table
CREATE TABLE IF NOT EXISTS command_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_text TEXT NOT NULL,
    action VARCHAR(80) NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    success BOOLEAN DEFAULT TRUE,
    response_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cmd_history_user ON command_history(user_id);
