const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const usePostgres = Boolean(process.env.DATABASE_URL);
const sqlitePath = process.env.SQLITE_PATH || process.env.DATABASE_PATH || './health.db';

let sqliteDb = null;
let pgPool = null;

const connectPostgres = async () => {
  const sslDisabled = process.env.PGSSLMODE === 'disable' || process.env.PGSSL_DISABLE === 'true';
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslDisabled ? false : { rejectUnauthorized: false }
  });
  await pgPool.query('SELECT 1');
};

const ensureSqliteDir = () => {
  const dir = path.dirname(sqlitePath);
  if (dir && dir !== '.' && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const initSqlite = () => new Promise((resolve, reject) => {
  ensureSqliteDir();
  sqliteDb = new sqlite3.Database(sqlitePath, (err) => {
    if (err) reject(err);
    else resolve();
  });
});

const createTablesSqlite = async () => {
  await run(
    `CREATE TABLE IF NOT EXISTS health_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS daily_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS medical_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_date DATE NOT NULL,
      category TEXT,
      title TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  );
};

const createTablesPostgres = async () => {
  await run(
    `CREATE TABLE IF NOT EXISTS health_data (
      id SERIAL PRIMARY KEY,
      type TEXT,
      data TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS daily_notes (
      id SERIAL PRIMARY KEY,
      note_text TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
  await run(
    `CREATE TABLE IF NOT EXISTS medical_timeline (
      id SERIAL PRIMARY KEY,
      event_date DATE NOT NULL,
      category TEXT,
      title TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`
  );
};

async function initDb() {
  if (usePostgres) {
    await connectPostgres();
    await createTablesPostgres();
  } else {
    await initSqlite();
    await createTablesSqlite();
  }
}

async function all(sql, params = []) {
  if (usePostgres) {
    const result = await pgPool.query(sql, params);
    return result.rows;
  }

  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function run(sql, params = []) {
  if (usePostgres) {
    return pgPool.query(sql, params);
  }

  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

const isPostgres = () => usePostgres;
const getSqlitePath = () => sqlitePath;

module.exports = { initDb, all, run, isPostgres, getSqlitePath };
