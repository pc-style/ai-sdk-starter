import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Get database path
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'mail.db');

// Initialize database
export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Schema definitions
export function initializeDatabase() {
  db.exec(`
    -- Email accounts table
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      email TEXT NOT NULL,
      name TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expiry INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Snooze entries table
    CREATE TABLE IF NOT EXISTS snooze_entries (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      snooze_until INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Send later queue table
    CREATE TABLE IF NOT EXISTS send_later_queue (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      to_email TEXT NOT NULL,
      subject TEXT,
      body TEXT NOT NULL,
      scheduled_time INTEGER NOT NULL,
      sent BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Email rules table
    CREATE TABLE IF NOT EXISTS email_rules (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      name TEXT NOT NULL,
      conditions TEXT NOT NULL,
      actions TEXT NOT NULL,
      enabled BOOLEAN DEFAULT 1,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    );

    -- Labels/categories cache table
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      label_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      UNIQUE(account_id, label_id)
    );

    -- User preferences table
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
    CREATE INDEX IF NOT EXISTS idx_snooze_account ON snooze_entries(account_id);
    CREATE INDEX IF NOT EXISTS idx_snooze_until ON snooze_entries(snooze_until);
    CREATE INDEX IF NOT EXISTS idx_send_later_account ON send_later_queue(account_id);
    CREATE INDEX IF NOT EXISTS idx_send_later_scheduled ON send_later_queue(scheduled_time, sent);
    CREATE INDEX IF NOT EXISTS idx_rules_account ON email_rules(account_id);
    CREATE INDEX IF NOT EXISTS idx_labels_account ON labels(account_id);
  `);
}

// Types
export interface Account {
  id: string;
  provider: 'gmail' | 'outlook';
  email: string;
  name?: string;
  access_token: string;
  refresh_token?: string;
  token_expiry?: number;
  created_at: number;
  updated_at: number;
}

export interface SnoozeEntry {
  id: string;
  account_id: string;
  message_id: string;
  snooze_until: number;
  created_at: number;
}

export interface SendLaterEntry {
  id: string;
  account_id: string;
  to_email: string;
  subject?: string;
  body: string;
  scheduled_time: number;
  sent: boolean;
  created_at: number;
}

export interface EmailRule {
  id: string;
  account_id: string;
  name: string;
  conditions: string; // JSON string
  actions: string; // JSON string
  enabled: boolean;
  created_at: number;
}

export interface Label {
  id: string;
  account_id: string;
  label_id: string;
  name: string;
  type?: string;
  created_at: number;
}

// Initialize database on import
initializeDatabase();
