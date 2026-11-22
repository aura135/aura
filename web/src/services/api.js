// AURA Unified Backend API Client with Offline Support
const API_BASE = '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('aura_auth_token') || null;
    this.user = JSON.parse(localStorage.getItem('aura_user_profile') || 'null');
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingData();
    });
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  setToken(token, user = null) {
    this.token = token;
    if (token) {
      localStorage.setItem('aura_auth_token', token);
    } else {
      localStorage.removeItem('aura_auth_token');
    }
    if (user) {
      this.user = user;
      localStorage.setItem('aura_user_profile', JSON.stringify(user));
    } else if (!token) {
      this.user = null;
      localStorage.removeItem('aura_user_profile');
    }
  }

  isAuthenticated() {
    return Boolean(this.token);
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      console.warn(`[AURA API] Request ${endpoint} failed:`, err.message);
      // If offline or server down, handle graceful local fallback
      return this.handleOfflineFallback(endpoint, options, err);
    }
  }

  // Fallback storage when running offline
  handleOfflineFallback(endpoint, options, error) {
    const method = options.method || 'GET';
    const storageKey = `aura_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;

    if (method === 'GET') {
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        return { ...JSON.parse(cached), _fromCache: true, _offline: true };
      }
      // Return empty structures if no cache
      if (endpoint.includes('/notes')) return { success: true, notes: [], _offline: true };
      if (endpoint.includes('/tasks')) return { success: true, tasks: [], _offline: true };
      if (endpoint.includes('/reminders')) return { success: true, reminders: [], _offline: true };
      if (endpoint.includes('/alarms')) return { success: true, alarms: [], _offline: true };
      if (endpoint.includes('/commands')) return { success: true, history: [], _offline: true };
      if (endpoint.includes('/preferences')) return { success: true, preferences: {}, _offline: true };
      if (endpoint.includes('/devices')) return { success: true, devices: [], _offline: true };
    }

    // For POST/PUT when offline, store in pending queue
    if (method === 'POST' || method === 'PUT') {
      const pending = JSON.parse(localStorage.getItem('aura_pending_sync') || '[]');
      pending.push({ endpoint, options, timestamp: Date.now() });
      localStorage.setItem('aura_pending_sync', JSON.stringify(pending));
      return { success: true, message: 'Saved offline. Will sync when reconnected.', _offline: true };
    }

    throw error;
  }

  async syncPendingData() {
    const pending = JSON.parse(localStorage.getItem('aura_pending_sync') || '[]');
    if (pending.length === 0) return;

    console.log(`[AURA SYNC] Synchronizing ${pending.length} pending offline actions...`);
    const remaining = [];
    for (const item of pending) {
      try {
        await fetch(`${API_BASE}${item.endpoint}`, {
          ...item.options,
          headers: this.getHeaders()
        });
      } catch (e) {
        remaining.push(item);
      }
    }
    localStorage.setItem('aura_pending_sync', JSON.stringify(remaining));
  }

  // --- Auth API ---
  async register(email, password, fullName, preferredLanguage = 'en') {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName, preferred_language: preferredLanguage })
    });
    if (data.token) {
      this.setToken(data.token, data.user);
    }
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      this.setToken(data.token, data.user);
    }
    return data;
  }

  logout() {
    this.setToken(null, null);
  }

  async getProfile() {
    return this.request('/auth/me');
  }

  async updateProfile(fullName, preferredLanguage) {
    const data = await this.request('/auth/me', {
      method: 'PUT',
      body: JSON.stringify({ full_name: fullName, preferred_language: preferredLanguage })
    });
    if (data.user) {
      this.user = { ...this.user, ...data.user };
      localStorage.setItem('aura_user_profile', JSON.stringify(this.user));
    }
    return data;
  }

  // --- Notes & Ordered Points API ---
  async getNotes() {
    const data = await this.request('/notes');
    if (data.success && data.notes) {
      localStorage.setItem('aura_cache_notes', JSON.stringify(data));
    }
    return data;
  }

  async createNote(title, points = [], category = 'General') {
    return this.request('/notes', {
      method: 'POST',
      body: JSON.stringify({ title, points, category })
    });
  }

  async deleteNote(noteId) {
    return this.request(`/notes/${noteId}`, { method: 'DELETE' });
  }

  async addNotePoint(noteId, pointText, pointOrder) {
    return this.request(`/notes/${noteId}/points`, {
      method: 'POST',
      body: JSON.stringify({ point_text: pointText, point_order: pointOrder })
    });
  }

  // --- Tasks API ---
  async getTasks() {
    const data = await this.request('/tasks');
    if (data.success && data.tasks) {
      localStorage.setItem('aura_cache_tasks', JSON.stringify(data));
    }
    return data;
  }

  async createTask(title, description = '', dueDate = null) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify({ title, description, due_date: dueDate })
    });
  }

  async toggleTask(taskId) {
    return this.request(`/tasks/${taskId}/complete`, { method: 'PATCH' });
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, { method: 'DELETE' });
  }

  // --- Reminders & Free-Time Windows API ---
  async getReminders() {
    const data = await this.request('/reminders');
    if (data.success && data.reminders) {
      localStorage.setItem('aura_cache_reminders', JSON.stringify(data));
    }
    return data;
  }

  async createReminder(title, reminderTime, isFreeTime = false, freeTimeStart = '', freeTimeEnd = '') {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify({
        title,
        reminder_time: reminderTime,
        is_free_time: isFreeTime,
        free_time_start: freeTimeStart,
        free_time_end: freeTimeEnd
      })
    });
  }

  async toggleReminder(reminderId) {
    return this.request(`/reminders/${reminderId}/complete`, { method: 'PATCH' });
  }

  async deleteReminder(reminderId) {
    return this.request(`/reminders/${reminderId}`, { method: 'DELETE' });
  }

  // --- Alarms API ---
  async getAlarms() {
    const data = await this.request('/alarms');
    if (data.success && data.alarms) {
      localStorage.setItem('aura_cache_alarms', JSON.stringify(data));
    }
    return data;
  }

  async createAlarm(hour, minute, label = 'AURA Alarm') {
    return this.request('/alarms', {
      method: 'POST',
      body: JSON.stringify({ hour, minute, label })
    });
  }

  async toggleAlarm(alarmId) {
    return this.request(`/alarms/${alarmId}/toggle`, { method: 'PATCH' });
  }

  async deleteAlarm(alarmId) {
    return this.request(`/alarms/${alarmId}`, { method: 'DELETE' });
  }

  // --- Preferences API ---
  async getPreferences() {
    return this.request('/preferences');
  }

  async setPreference(key, value) {
    return this.request('/preferences', {
      method: 'PUT',
      body: JSON.stringify({ key, value })
    });
  }

  // --- Devices API ---
  async getDevices() {
    return this.request('/devices');
  }

  async registerDevice(deviceName, deviceType, pushToken = '') {
    return this.request('/devices/register', {
      method: 'POST',
      body: JSON.stringify({
        device_name: deviceName,
        device_type: deviceType,
        push_token: pushToken,
        user_agent: navigator.userAgent
      })
    });
  }

  async unregisterDevice(deviceId) {
    return this.request(`/devices/${deviceId}`, { method: 'DELETE' });
  }

  // --- Command History API ---
  async getCommandHistory() {
    return this.request('/commands');
  }

  async logCommand(rawText, action, language, success, responseText) {
    return this.request('/commands', {
      method: 'POST',
      body: JSON.stringify({
        raw_text: rawText,
        action,
        language,
        success,
        response_text: responseText
      })
    });
  }

  // --- Sync API ---
  async pullSync(since = 0) {
    return this.request(`/sync/pull?since=${since}`);
  }

  async pushSync(notes, reminders, tasks) {
    return this.request('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ notes, reminders, tasks })
    });
  }
}

export const api = new ApiService();
