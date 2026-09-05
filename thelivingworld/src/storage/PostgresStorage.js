import { query, getPool } from './db.js';

export class PostgresStorage {
  constructor(fallbackStorage = null) {
    this.fallback = fallbackStorage;
  }

  async load() {
    const pool = getPool();
    if (!pool) {
      return this.fallback?.load() || null;
    }

    try {
      const res = await query('SELECT data FROM game_snapshots WHERE id = $1', ['latest']);
      if (res.rows.length > 0) {
        return res.rows[0].data;
      }
      return this.fallback?.load() || null;
    } catch (err) {
      console.warn('PostgresStorage.load failed, falling back:', err.message);
      return this.fallback?.load() || null;
    }
  }

  async save(state) {
    const pool = getPool();
    if (!pool) {
      return this.fallback?.save(state) || false;
    }

    try {
      // 1. Save full JSON snapshot for atomic integrity
      await query(
        `INSERT INTO game_snapshots (id, data, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP`,
        ['latest', JSON.stringify(state)]
      );

      // 2. Save structured game state
      if (state.season) {
        await query(
          `INSERT INTO game_state (id, season_id, era, progress, start_time, end_time, discoveries, stats, current_event, updated_at)
           VALUES ('current', $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
           ON CONFLICT (id) DO UPDATE SET
             season_id = EXCLUDED.season_id,
             era = EXCLUDED.era,
             progress = EXCLUDED.progress,
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             discoveries = EXCLUDED.discoveries,
             stats = EXCLUDED.stats,
             current_event = EXCLUDED.current_event,
             updated_at = CURRENT_TIMESTAMP`,
          [
            state.season.id || 'season-001',
            state.season.era || 1,
            state.season.progress || 0,
            state.season.start || null,
            state.season.end || null,
            JSON.stringify(state.discoveries || {}),
            JSON.stringify(state.stats || {}),
            state.currentEvent ? JSON.stringify(state.currentEvent) : null
          ]
        );
      }

      // 3. Upsert habitants for structured querying (rankings, stats)
      if (Array.isArray(state.habitants)) {
        for (const h of state.habitants) {
          await query(
            `INSERT INTO habitants (id, name, level, experience, contribution, exploration, defense, title, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
             ON CONFLICT (id) DO UPDATE SET
               name = EXCLUDED.name,
               level = EXCLUDED.level,
               experience = EXCLUDED.experience,
               contribution = EXCLUDED.contribution,
               exploration = EXCLUDED.exploration,
               defense = EXCLUDED.defense,
               title = EXCLUDED.title,
               updated_at = CURRENT_TIMESTAMP`,
            [
              h.id,
              h.name,
              h.level || 1,
              h.experience || 0,
              h.contribution || 0,
              h.exploration || 0,
              h.defense || 0,
              h.title || null
            ]
          );
        }
      }

      if (this.fallback) this.fallback.save(state);
      return true;
    } catch (err) {
      console.warn('PostgresStorage.save failed, relying on fallback:', err.message);
      if (this.fallback) return this.fallback.save(state);
      return false;
    }
  }
}
