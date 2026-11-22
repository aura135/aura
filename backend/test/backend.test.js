const assert = require('assert');
const http = require('http');
const app = require('../server');

let server;
const PORT = 4099;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- Starting AURA Backend Integration Tests ---');
  let authToken = null;
  const testEmail = `testuser_${Date.now()}@aura.ai`;

  // 1. Health Check
  const health = await makeRequest('GET', '/api/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.body.status, 'ONLINE');
  console.log('✓ Health check passed');

  // 2. Register
  const reg = await makeRequest('POST', '/api/auth/register', {
    email: testEmail,
    password: 'password123',
    full_name: 'Test Commander',
    preferred_language: 'te'
  });
  assert.strictEqual(reg.status, 201);
  assert.ok(reg.body.token);
  authToken = reg.body.token;
  console.log('✓ User registration & JWT generation passed');

  // 3. Login
  const login = await makeRequest('POST', '/api/auth/login', {
    email: testEmail,
    password: 'password123'
  });
  assert.strictEqual(login.status, 200);
  assert.ok(login.body.token);
  console.log('✓ User login with bcrypt verification passed');

  // 4. User Profile
  const me = await makeRequest('GET', '/api/auth/me', null, authToken);
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.body.user.email, testEmail);
  console.log('✓ Authenticated profile retrieval passed');

  // 5. Notes with Ordered Points
  const newNote = await makeRequest('POST', '/api/notes', {
    title: 'Project Deliverables',
    category: 'Work',
    points: ['Complete assignment', 'Call project team', 'Submit final report']
  }, authToken);
  assert.strictEqual(newNote.status, 201);
  assert.strictEqual(newNote.body.note.points.length, 3);
  const noteId = newNote.body.note.id;
  console.log('✓ Created Note with 3 Ordered Points passed');

  const notesList = await makeRequest('GET', '/api/notes', null, authToken);
  assert.strictEqual(notesList.status, 200);
  assert.ok(notesList.body.notes.length >= 1);
  console.log('✓ Fetched Notes and Ordered Points passed');

  // 6. Tasks
  const newTask = await makeRequest('POST', '/api/tasks', {
    title: 'Review AURA Architecture'
  }, authToken);
  assert.strictEqual(newTask.status, 201);
  const taskId = newTask.body.task.id;

  const toggleTask = await makeRequest('PATCH', `/api/tasks/${taskId}/complete`, null, authToken);
  assert.strictEqual(toggleTask.status, 200);
  assert.strictEqual(toggleTask.body.task.is_completed, true);
  console.log('✓ Task creation & completion toggle passed');

  // 7. Reminders with Free-Time Window
  const newRem = await makeRequest('POST', '/api/reminders', {
    title: 'Free Time Review',
    reminder_time: Date.now() + 3600000,
    is_free_time: true,
    free_time_start: '6 PM',
    free_time_end: '8 PM'
  }, authToken);
  assert.strictEqual(newRem.status, 201);
  assert.strictEqual(newRem.body.reminder.is_free_time, true);
  console.log('✓ Free-time window reminder creation passed');

  // 8. Alarms
  const newAlarm = await makeRequest('POST', '/api/alarms', {
    hour: 6,
    minute: 30,
    label: 'Morning Workout'
  }, authToken);
  assert.strictEqual(newAlarm.status, 201);
  console.log('✓ Alarm scheduling passed');

  // 9. Preferences
  const setPref = await makeRequest('PUT', '/api/preferences', {
    key: 'speech_rate',
    value: '1.2'
  }, authToken);
  assert.strictEqual(setPref.status, 200);

  const getPrefs = await makeRequest('GET', '/api/preferences', null, authToken);
  assert.strictEqual(getPrefs.status, 200);
  assert.strictEqual(getPrefs.body.preferences.speech_rate, '1.2');
  console.log('✓ Preferences update and retrieval passed');

  // 10. Device Registration
  const regDev = await makeRequest('POST', '/api/devices/register', {
    device_name: 'Chrome on Pixel 8',
    device_type: 'pwa',
    push_token: 'test_token_123'
  }, authToken);
  assert.strictEqual(regDev.status, 201);
  console.log('✓ Device registration passed');

  // 11. Command History
  const logCmd = await makeRequest('POST', '/api/commands', {
    raw_text: 'Hey AURA, note this',
    action: 'POINTS_SAVE',
    language: 'en',
    success: true,
    response_text: 'Saved 3 points'
  }, authToken);
  assert.strictEqual(logCmd.status, 201);

  const history = await makeRequest('GET', '/api/commands', null, authToken);
  assert.strictEqual(history.status, 200);
  assert.ok(history.body.history.length >= 1);
  console.log('✓ Spoken command history audit log passed');

  // 12. Cross-Platform Sync Pull
  const syncPull = await makeRequest('GET', '/api/sync/pull', null, authToken);
  assert.strictEqual(syncPull.status, 200);
  assert.ok(Array.isArray(syncPull.body.notes));
  assert.ok(Array.isArray(syncPull.body.reminders));
  assert.ok(Array.isArray(syncPull.body.tasks));
  console.log('✓ Cross-platform sync pull passed');

  console.log('\n>>> ALL 12 BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! <<<\n');
}

server = app.listen(PORT, async () => {
  try {
    await runTests();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    server.close();
    process.exit(1);
  }
});
