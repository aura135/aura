const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

let pool = null;
let usePostgres = false;

// Fallback JSON-persisted store for standalone offline development & test runs
const LOCAL_STORAGE_PATH = path.join(__dirname, '..', 'aura_dev_store.json');

class LocalStore {
  constructor() {
    this.data = {
      users: [],
      devices: [],
      notes: [],
      note_points: [],
      tasks: [],
      reminders: [],
      alarms: [],
      user_preferences: [],
      command_history: [],
      sequences: {
        users: 1,
        devices: 1,
        notes: 1,
        note_points: 1,
        tasks: 1,
        reminders: 1,
        alarms: 1,
        user_preferences: 1,
        command_history: 1
      }
    };
    this.load();
  }

  load() {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      try {
        const raw = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (e) {
        console.warn('[AURA DB] Could not read local store, using default');
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[AURA DB] Failed to persist local store:', e.message);
    }
  }

  nextId(table) {
    if (!this.data.sequences[table]) this.data.sequences[table] = 1;
    return this.data.sequences[table]++;
  }
}

const localStore = new LocalStore();

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    try {
      pool = new Pool({
        connectionString: dbUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      const client = await pool.connect();
      console.log('[AURA DB] Successfully connected to PostgreSQL instance');
      client.release();
      usePostgres = true;

      // Run schema migration if file exists
      const schemaPath = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
      if (fs.existsSync(schemaPath)) {
        const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
        await pool.query(schemaSql);
        console.log('[AURA DB] PostgreSQL schema migrations applied successfully');
      }
      return;
    } catch (err) {
      console.warn(`[AURA DB] PostgreSQL connection to ${dbUrl} failed (${err.message}). Falling back to local persistent storage adapter.`);
      usePostgres = false;
    }
  } else {
    console.log('[AURA DB] No DATABASE_URL specified. Running with persistent local storage adapter.');
  }
}

/**
 * Universal Query Adapter supporting both PostgreSQL and Local Store
 */
async function query(text, params = []) {
  if (usePostgres && pool) {
    return pool.query(text, params);
  }

  // Handle local store queries
  return executeLocalQuery(text, params);
}

function executeLocalQuery(sql, params) {
  const clean = sql.trim();
  const lower = clean.toLowerCase();

  // 1. SELECT queries
  if (lower.startsWith('select')) {
    // USERS lookup by email
    if (lower.includes('from users') && lower.includes('where email')) {
      const email = params[0];
      const user = localStore.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return { rows: user ? [user] : [] };
    }
    // USERS lookup by id
    if (lower.includes('from users') && lower.includes('where id')) {
      const id = parseInt(params[0], 10);
      const user = localStore.data.users.find(u => u.id === id);
      return { rows: user ? [user] : [] };
    }
    // NOTES by user_id
    if (lower.includes('from notes') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      let rows = localStore.data.notes.filter(n => n.user_id === userId);
      // Attach ordered points
      rows = rows.map(n => {
        const points = localStore.data.note_points
          .filter(p => p.note_id === n.id)
          .sort((a, b) => a.point_order - b.point_order);
        return { ...n, points };
      });
      rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }
    // NOTE by id and user_id
    if (lower.includes('from notes') && lower.includes('where id = $1 and user_id = $2')) {
      const id = parseInt(params[0], 10);
      const userId = parseInt(params[1], 10);
      const note = localStore.data.notes.find(n => n.id === id && n.user_id === userId);
      if (note) {
        const points = localStore.data.note_points
          .filter(p => p.note_id === note.id)
          .sort((a, b) => a.point_order - b.point_order);
        return { rows: [{ ...note, points }] };
      }
      return { rows: [] };
    }
    // NOTE_POINTS by note_id
    if (lower.includes('from note_points') && lower.includes('where note_id')) {
      const noteId = parseInt(params[0], 10);
      const rows = localStore.data.note_points
        .filter(p => p.note_id === noteId)
        .sort((a, b) => a.point_order - b.point_order);
      return { rows };
    }
    // TASKS by user_id
    if (lower.includes('from tasks') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      const rows = localStore.data.tasks
        .filter(t => t.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }
    // REMINDERS by user_id
    if (lower.includes('from reminders') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      const rows = localStore.data.reminders
        .filter(r => r.user_id === userId)
        .sort((a, b) => (a.reminder_time || 0) - (b.reminder_time || 0));
      return { rows };
    }
    // ALARMS by user_id
    if (lower.includes('from alarms') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      const rows = localStore.data.alarms
        .filter(a => a.user_id === userId)
        .sort((a, b) => a.hour - b.hour || a.minute - b.minute);
      return { rows };
    }
    // PREFERENCES by user_id
    if (lower.includes('from user_preferences') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      const rows = localStore.data.user_preferences.filter(p => p.user_id === userId);
      return { rows };
    }
    // DEVICES by user_id
    if (lower.includes('from devices') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      const rows = localStore.data.devices.filter(d => d.user_id === userId);
      return { rows };
    }
    // COMMAND_HISTORY by user_id
    if (lower.includes('from command_history') && lower.includes('where user_id')) {
      const userId = parseInt(params[0], 10);
      const rows = localStore.data.command_history
        .filter(c => c.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 50);
      return { rows };
    }
  }

  // 2. INSERT queries
  if (lower.startsWith('insert into users')) {
    const [email, password_hash, full_name, preferred_language] = params;
    const newUser = {
      id: localStore.nextId('users'),
      email,
      password_hash,
      full_name: full_name || email.split('@')[0],
      avatar_url: '',
      preferred_language: preferred_language || 'en',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.data.users.push(newUser);
    localStore.save();
    return { rows: [newUser] };
  }

  if (lower.startsWith('insert into notes')) {
    const [user_id, title, category] = params;
    const newNote = {
      id: localStore.nextId('notes'),
      user_id: parseInt(user_id, 10),
      title,
      category: category || 'General',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.data.notes.push(newNote);
    localStore.save();
    return { rows: [newNote] };
  }

  if (lower.startsWith('insert into note_points')) {
    const [note_id, user_id, point_text, point_order] = params;
    const newPoint = {
      id: localStore.nextId('note_points'),
      note_id: parseInt(note_id, 10),
      user_id: parseInt(user_id, 10),
      point_text,
      point_order: parseInt(point_order, 10) || 1,
      created_at: new Date().toISOString()
    };
    localStore.data.note_points.push(newPoint);
    localStore.save();
    return { rows: [newPoint] };
  }

  if (lower.startsWith('insert into tasks')) {
    const [user_id, title, description, due_date] = params;
    const newTask = {
      id: localStore.nextId('tasks'),
      user_id: parseInt(user_id, 10),
      title,
      description: description || '',
      is_completed: false,
      due_date: due_date ? parseInt(due_date, 10) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localStore.data.tasks.push(newTask);
    localStore.save();
    return { rows: [newTask] };
  }

  if (lower.startsWith('insert into reminders')) {
    const [user_id, title, reminder_time, repeat_type, is_free_time, free_time_start, free_time_end] = params;
    const newReminder = {
      id: localStore.nextId('reminders'),
      user_id: parseInt(user_id, 10),
      title,
      reminder_time: parseInt(reminder_time, 10),
      repeat_type: repeat_type || 'NONE',
      is_free_time: Boolean(is_free_time),
      free_time_start: free_time_start || '',
      free_time_end: free_time_end || '',
      is_completed: false,
      created_at: new Date().toISOString()
    };
    localStore.data.reminders.push(newReminder);
    localStore.save();
    return { rows: [newReminder] };
  }

  if (lower.startsWith('insert into alarms')) {
    const [user_id, hour, minute, label, days_of_week] = params;
    const newAlarm = {
      id: localStore.nextId('alarms'),
      user_id: parseInt(user_id, 10),
      hour: parseInt(hour, 10),
      minute: parseInt(minute, 10),
      label: label || 'AURA Alarm',
      days_of_week: days_of_week || 'DAILY',
      is_enabled: true,
      created_at: new Date().toISOString()
    };
    localStore.data.alarms.push(newAlarm);
    localStore.save();
    return { rows: [newAlarm] };
  }

  if (lower.startsWith('insert into user_preferences') || lower.includes('on conflict (user_id, pref_key)')) {
    const [user_id, pref_key, pref_value] = params;
    const uId = parseInt(user_id, 10);
    const existingIdx = localStore.data.user_preferences.findIndex(p => p.user_id === uId && p.pref_key === pref_key);
    if (existingIdx !== -1) {
      localStore.data.user_preferences[existingIdx].pref_value = pref_value;
      localStore.data.user_preferences[existingIdx].updated_at = new Date().toISOString();
    } else {
      localStore.data.user_preferences.push({
        id: localStore.nextId('user_preferences'),
        user_id: uId,
        pref_key,
        pref_value,
        updated_at: new Date().toISOString()
      });
    }
    localStore.save();
    return { rowCount: 1 };
  }

  if (lower.startsWith('insert into devices')) {
    const [user_id, device_name, device_type, push_token, user_agent] = params;
    const newDevice = {
      id: localStore.nextId('devices'),
      user_id: parseInt(user_id, 10),
      device_name,
      device_type,
      push_token: push_token || '',
      user_agent: user_agent || '',
      last_active: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    localStore.data.devices.push(newDevice);
    localStore.save();
    return { rows: [newDevice] };
  }

  if (lower.startsWith('insert into command_history')) {
    const [user_id, raw_text, action, language, success, response_text] = params;
    const newCmd = {
      id: localStore.nextId('command_history'),
      user_id: parseInt(user_id, 10),
      raw_text,
      action,
      language: language || 'en',
      success: Boolean(success),
      response_text,
      created_at: new Date().toISOString()
    };
    localStore.data.command_history.push(newCmd);
    localStore.save();
    return { rows: [newCmd] };
  }

  // 3. UPDATE / PATCH queries
  if (lower.startsWith('update tasks set is_completed')) {
    const [id, user_id] = params;
    const task = localStore.data.tasks.find(t => t.id === parseInt(id, 10) && t.user_id === parseInt(user_id, 10));
    if (task) {
      task.is_completed = !task.is_completed;
      task.updated_at = new Date().toISOString();
      localStore.save();
      return { rows: [task], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update reminders set is_completed')) {
    const [id, user_id] = params;
    const rem = localStore.data.reminders.find(r => r.id === parseInt(id, 10) && r.user_id === parseInt(user_id, 10));
    if (rem) {
      rem.is_completed = !rem.is_completed;
      localStore.save();
      return { rows: [rem], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update alarms set is_enabled')) {
    const [id, user_id] = params;
    const alarm = localStore.data.alarms.find(a => a.id === parseInt(id, 10) && a.user_id === parseInt(user_id, 10));
    if (alarm) {
      alarm.is_enabled = !alarm.is_enabled;
      localStore.save();
      return { rows: [alarm], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (lower.startsWith('update users set')) {
    const id = parseInt(params[params.length - 1], 10);
    const user = localStore.data.users.find(u => u.id === id);
    if (user) {
      if (params.length === 3) {
        user.full_name = params[0];
        user.preferred_language = params[1];
      }
      user.updated_at = new Date().toISOString();
      localStore.save();
      return { rows: [user], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 4. DELETE queries
  if (lower.startsWith('delete from notes')) {
    const [id, user_id] = params;
    const noteId = parseInt(id, 10);
    const uId = parseInt(user_id, 10);
    localStore.data.notes = localStore.data.notes.filter(n => !(n.id === noteId && n.user_id === uId));
    localStore.data.note_points = localStore.data.note_points.filter(p => !(p.note_id === noteId && p.user_id === uId));
    localStore.save();
    return { rowCount: 1 };
  }

  if (lower.startsWith('delete from tasks')) {
    const [id, user_id] = params;
    const taskId = parseInt(id, 10);
    const uId = parseInt(user_id, 10);
    localStore.data.tasks = localStore.data.tasks.filter(t => !(t.id === taskId && t.user_id === uId));
    localStore.save();
    return { rowCount: 1 };
  }

  if (lower.startsWith('delete from reminders')) {
    const [id, user_id] = params;
    const remId = parseInt(id, 10);
    const uId = parseInt(user_id, 10);
    localStore.data.reminders = localStore.data.reminders.filter(r => !(r.id === remId && r.user_id === uId));
    localStore.save();
    return { rowCount: 1 };
  }

  if (lower.startsWith('delete from alarms')) {
    const [id, user_id] = params;
    const alarmId = parseInt(id, 10);
    const uId = parseInt(user_id, 10);
    localStore.data.alarms = localStore.data.alarms.filter(a => !(a.id === alarmId && a.user_id === uId));
    localStore.save();
    return { rowCount: 1 };
  }

  if (lower.startsWith('delete from devices')) {
    const [id, user_id] = params;
    const devId = parseInt(id, 10);
    const uId = parseInt(user_id, 10);
    localStore.data.devices = localStore.data.devices.filter(d => !(d.id === devId && d.user_id === uId));
    localStore.save();
    return { rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}

module.exports = {
  query,
  initDatabase,
  getPool: () => pool,
  isPostgres: () => usePostgres
};
