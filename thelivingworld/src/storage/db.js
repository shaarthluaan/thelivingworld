import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  const useSsl = process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production' || (connectionString && connectionString.includes('render.com'));

  if (connectionString) {
    return {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000
    };
  }

  if (process.env.PGHOST || process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'thelivingworld',
      ssl: useSsl ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 5000
    };
  }

  return null;
}

let pool = null;

export function getPool() {
  if (!pool) {
    const config = createPoolConfig();
    if (config) {
      pool = new Pool(config);
      pool.on('error', (err) => {
        console.error('Unexpected PostgreSQL Pool Error:', err.message);
      });
    }
  }
  return pool;
}

export async function query(text, params) {
  const activePool = getPool();
  if (!activePool) {
    throw new Error('PostgreSQL database credentials not configured.');
  }
  return activePool.query(text, params);
}

export async function initSchema() {
  const activePool = getPool();
  if (!activePool) return { initialized: false, reason: 'No DATABASE_URL configured' };

  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await activePool.query(sql);
    return { initialized: true };
  } catch (err) {
    console.error('Failed to initialize database schema:', err.message);
    return { initialized: false, reason: err.message };
  }
}

export async function testConnection() {
  try {
    const activePool = getPool();
    if (!activePool) {
      return { connected: false, reason: 'No DATABASE_URL configured' };
    }
    const res = await activePool.query('SELECT NOW()');
    return { connected: true, timestamp: res.rows[0].now };
  } catch (err) {
    return { connected: false, reason: err.message };
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
