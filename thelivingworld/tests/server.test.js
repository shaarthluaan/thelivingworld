import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { WebSocket } from 'ws';
import { server, wss } from '../server.js';
import { getPool, testConnection, closePool } from '../src/storage/db.js';

const TEST_PORT = 3999;

test.before(async () => {
  await new Promise((resolve) => {
    server.listen(TEST_PORT, '127.0.0.1', resolve);
  });
});

test.after(async () => {
  await closePool();
  wss.close();
  await new Promise((resolve) => {
    server.close(resolve);
  });
});

test('GET /health returns 200 OK with expected JSON body', async () => {
  const response = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });

  assert.equal(response.statusCode, 200);
  const json = JSON.parse(response.data);
  assert.equal(json.status, 'ok');
  assert.equal(json.service, 'the-living-world');
  assert.ok(typeof json.uptime === 'number');
  assert.ok(json.timestamp);
  assert.ok(json.database);
});

test('Static file request / returns index.html content', async () => {
  const response = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${TEST_PORT}/`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    }).on('error', reject);
  });

  assert.equal(response.statusCode, 200);
  assert.match(response.data, /<!doctype html>/i);
});

test('WebSocket connects and receives status packet', async () => {
  const ws = new WebSocket(`ws://127.0.0.1:${TEST_PORT}`);
  
  const statusMessage = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('WS timeout')), 3000);
    ws.on('message', (data) => {
      clearTimeout(timer);
      resolve(JSON.parse(data.toString()));
    });
    ws.on('error', reject);
  });

  assert.equal(statusMessage.kind, 'status');
  assert.equal(statusMessage.status.status, 'CONNECTED');
  ws.close();
});

test('Database configuration module gracefully handles missing credentials', async () => {
  const connectionResult = await testConnection();
  assert.equal(typeof connectionResult.connected, 'boolean');
});
