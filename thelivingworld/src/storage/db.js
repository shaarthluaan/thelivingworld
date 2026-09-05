import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

function createPoolConfig() {
  const connectionString = process.env.DATABASE_URL;
  const useSsl = process.env.DATABASE_SSL === 'true' || process.env.NODE_ENV === 'production';

  if (connectionString) {
    return {
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: false } : false
    };
  }

  if (process.env.PGHOST || process.env.PGDATABASE) {
    return {
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || '',
      database: process.env.PGDATABASE || 'thelivingworld',
      ssl: useSsl ? { rejectUnauthorized: false } : false
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
        console.error('Unexpected PostgreSQL Pool Error:', err);
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

export async function testConnection() {
  try {
    const activePool = getPool();
    if (!activePool) {
      return { connected: false, reason: 'No environment variables configured' };
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
