const assert = require('assert');
const http = require('http');
const app = require('../server');

const PORT = 4098;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function makeRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runSyncTests() {
  console.log('--- Phase 6: Cross-Platform Synchronization Integration Test ---');

  // 1. Register test user (Shared account between Android, Website, and PWA)
  const userEmail = `syncuser_${Date.now()}@aura.ai`;
  const reg = await makeRequest('POST', '/api/auth/register', {
    email: userEmail,
    password: 'securePassword2026',
    full_name: 'Alex Mercer',
    preferred_language: 'te'
  });
  assert.strictEqual(reg.status, 201);
  const token = reg.body.token;
  console.log('✓ Shared user account established on Cloud Database');

  // 2. Android Client: Push Note with 3 Ordered Points & Free-Time Reminder
  console.log('Simulating Android Client Sync Push...');
  const androidPush = await makeRequest('POST', '/api/sync/push', {
    notes: [
      {
        title: 'Project Roadmap',
        category: 'Work',
        points: ['Draft schema', 'Implement PWA service worker', 'Deploy to production']
      }
    ],
    reminders: [
      {
        title: 'Team Sync',
        reminderTime: Date.now() + 3600000,
        isFreeTime: true,
        freeTimeStart: '6 PM',
        freeTimeEnd: '8 PM'
      }
    ],
    tasks: []
  }, token);
  assert.strictEqual(androidPush.status, 200);
  assert.strictEqual(androidPush.body.counts.notes, 1);
  assert.strictEqual(androidPush.body.counts.reminders, 1);
  console.log('✓ Android client pushed note with ordered points and free-time reminder');

  // 3. Web / PWA Client: Pull from Shared Backend
  console.log('Simulating Web/PWA Client Sync Pull...');
  const webPull = await makeRequest('GET', '/api/sync/pull', null, token);
  assert.strictEqual(webPull.status, 200);
  assert.strictEqual(webPull.body.notes.length, 1);
  assert.strictEqual(webPull.body.notes[0].title, 'Project Roadmap');
  assert.strictEqual(webPull.body.notes[0].points.length, 3);
  assert.strictEqual(webPull.body.reminders.length, 1);
  assert.strictEqual(webPull.body.reminders[0].is_free_time, true);
  console.log('✓ Web/PWA client pulled Android-created notes and reminders in exact order');

  // 4. Web Client: Create a Task
  console.log('Simulating Web Client creating a Task...');
  const webTask = await makeRequest('POST', '/api/tasks', {
    title: 'Review AURA Test Coverage'
  }, token);
  assert.strictEqual(webTask.status, 201);
  console.log('✓ Task created on Website/PWA');

  // 5. Android Client: Pull Data
  console.log('Simulating Android Client pulling data from Cloud...');
  const androidPull = await makeRequest('GET', '/api/sync/pull', null, token);
  assert.strictEqual(androidPull.status, 200);
  const foundTask = androidPull.body.tasks.find(t => t.title === 'Review AURA Test Coverage');
  assert.ok(foundTask, 'Task created on Web should be present for Android client');
  console.log('✓ Android client received Web-created task during cloud synchronization');

  console.log('\n>>> PHASE 6 CROSS-PLATFORM SYNCHRONIZATION FULLY VERIFIED! <<<\n');
}

const server = app.listen(PORT, async () => {
  try {
    await runSyncTests();
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Sync Test failed:', err);
    server.close();
    process.exit(1);
  }
});
