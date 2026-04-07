import Database from 'better-sqlite3'

const MIGRATIONS: Array<{ version: number; up: string }> = [
  {
    version: 1,
    up: `
      CREATE TABLE IF NOT EXISTS projects (
        id          TEXT PRIMARY KEY,
        name        TEXT NOT NULL,
        color       TEXT NOT NULL DEFAULT '#6366F1',
        icon        TEXT,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at  INTEGER NOT NULL,
        updated_at  INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id           TEXT PRIMARY KEY,
        project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        source       TEXT NOT NULL DEFAULT 'manual',
        app_name     TEXT,
        window_title TEXT,
        started_at   INTEGER NOT NULL,
        ended_at     INTEGER,
        duration     INTEGER,
        notes        TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_project_id ON sessions(project_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
      CREATE INDEX IF NOT EXISTS idx_sessions_ended_at ON sessions(ended_at);

      CREATE TABLE IF NOT EXISTS focus_sessions (
        id              TEXT PRIMARY KEY,
        session_id      TEXT REFERENCES sessions(id),
        project_id      TEXT NOT NULL REFERENCES projects(id),
        goal            TEXT,
        duration_target INTEGER NOT NULL,
        duration_actual INTEGER,
        completed       INTEGER NOT NULL DEFAULT 0,
        started_at      INTEGER NOT NULL,
        ended_at        INTEGER
      );

      CREATE TABLE IF NOT EXISTS app_rules (
        id         TEXT PRIMARY KEY,
        app_name   TEXT NOT NULL UNIQUE,
        project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      INSERT OR IGNORE INTO settings (key, value) VALUES ('auto_detect_enabled', 'false');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('notifications_enabled', 'true');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('focus_break_duration', '300000');
      INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'dark');
    `
  },
  {
    version: 2,
    up: `
      ALTER TABLE sessions ADD COLUMN title TEXT;
    `
  },
  {
    version: 3,
    up: `
      CREATE TABLE IF NOT EXISTS clients (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        color      TEXT NOT NULL DEFAULT '#6366F1',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      ALTER TABLE projects ADD COLUMN client_id TEXT REFERENCES clients(id) ON DELETE SET NULL;
      ALTER TABLE projects ADD COLUMN goal_hours REAL;
      ALTER TABLE projects ADD COLUMN goal_period TEXT;
    `
  }
]

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY
    );
  `)

  const currentVersion =
    (db.prepare('SELECT MAX(version) as v FROM schema_version').get() as { v: number | null })?.v ??
    0

  for (const migration of MIGRATIONS) {
    if (migration.version > currentVersion) {
      db.exec(migration.up)
      db.prepare('INSERT OR REPLACE INTO schema_version (version) VALUES (?)').run(
        migration.version
      )
      console.log(`[DB] Migration ${migration.version} applied`)
    }
  }
}
