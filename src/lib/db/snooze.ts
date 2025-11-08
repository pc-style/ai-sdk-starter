import { db, SnoozeEntry } from './schema';
import { randomUUID } from 'crypto';

export class SnoozeDB {
  static create(accountId: string, messageId: string, snoozeUntil: number): SnoozeEntry {
    const now = Date.now();
    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO snooze_entries (id, account_id, message_id, snooze_until, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, accountId, messageId, snoozeUntil, now);

    return this.getById(id)!;
  }

  static getById(id: string): SnoozeEntry | undefined {
    const stmt = db.prepare('SELECT * FROM snooze_entries WHERE id = ?');
    return stmt.get(id) as SnoozeEntry | undefined;
  }

  static getByAccount(accountId: string): SnoozeEntry[] {
    const stmt = db.prepare('SELECT * FROM snooze_entries WHERE account_id = ? ORDER BY snooze_until ASC');
    return stmt.all(accountId) as SnoozeEntry[];
  }

  static getReady(): SnoozeEntry[] {
    const now = Date.now();
    const stmt = db.prepare('SELECT * FROM snooze_entries WHERE snooze_until <= ? ORDER BY snooze_until ASC');
    return stmt.all(now) as SnoozeEntry[];
  }

  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM snooze_entries WHERE id = ?');
    stmt.run(id);
  }

  static deleteByMessage(accountId: string, messageId: string): void {
    const stmt = db.prepare('DELETE FROM snooze_entries WHERE account_id = ? AND message_id = ?');
    stmt.run(accountId, messageId);
  }
}
