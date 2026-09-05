import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgresStorage } from '../src/storage/PostgresStorage.js';
import { testConnection, getPool, closePool } from '../src/storage/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.after(async () => {
  await closePool();
});

test('schema.sql exists and contains all required table definitions for game data', () => {
  const schemaPath = path.join(__dirname, '../src/storage/schema.sql');
  assert.ok(fs.existsSync(schemaPath), 'schema.sql file should exist');
  
  const sql = fs.readFileSync(schemaPath, 'utf8');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS game_snapshots/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS game_state/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS habitants/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS processed_events/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS game_feed/i);
});

test('PostgresStorage delegates to fallback storage when database is unavailable', async () => {
  let savedState = null;
  const dummyFallback = {
    load() { return { season: { id: 'season-test' }, habitants: [] }; },
    save(state) { savedState = state; return true; }
  };

  const store = new PostgresStorage(dummyFallback);
  const loaded = await store.load();
  assert.equal(loaded.season.id, 'season-test');

  const testState = { season: { id: 's1' }, habitants: [{ id: 'u1', name: 'Tester' }] };
  await store.save(testState);
  assert.equal(savedState.season.id, 's1');
});

test('db.js reads DATABASE_URL from process.env and configures pool', () => {
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL should be defined in process.env');
  const pool = getPool();
  assert.ok(pool, 'getPool() should return a pg.Pool instance');
});

test('testConnection handles connection attempt to Render internal hostname', async () => {
  const result = await testConnection();
  assert.equal(typeof result.connected, 'boolean');
  if (!result.connected) {
    assert.ok(result.reason, 'Reason should be provided on connection failure');
  }
});
