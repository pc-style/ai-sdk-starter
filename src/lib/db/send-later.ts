import { db, SendLaterEntry } from './schema';
import { randomUUID } from 'crypto';

export class SendLaterDB {
  static create(
    accountId: string,
    toEmail: string,
    subject: string | undefined,
    body: string,
    scheduledTime: number
  ): SendLaterEntry {
    const now = Date.now();
    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO send_later_queue (id, account_id, to_email, subject, body, scheduled_time, sent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, accountId, toEmail, subject || null, body, scheduledTime, 0, now);

    return this.getById(id)!;
  }

  static getById(id: string): SendLaterEntry | undefined {
    const stmt = db.prepare('SELECT * FROM send_later_queue WHERE id = ?');
    return stmt.get(id) as SendLaterEntry | undefined;
  }

  static getByAccount(accountId: string): SendLaterEntry[] {
    const stmt = db.prepare('SELECT * FROM send_later_queue WHERE account_id = ? ORDER BY scheduled_time ASC');
    return stmt.all(accountId) as SendLaterEntry[];
  }

  static getReady(): SendLaterEntry[] {
    const now = Date.now();
    const stmt = db.prepare('SELECT * FROM send_later_queue WHERE scheduled_time <= ? AND sent = 0 ORDER BY scheduled_time ASC');
    return stmt.all(now) as SendLaterEntry[];
  }

  static markAsSent(id: string): void {
    const stmt = db.prepare('UPDATE send_later_queue SET sent = 1 WHERE id = ?');
    stmt.run(id);
  }

  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM send_later_queue WHERE id = ?');
    stmt.run(id);
  }
}
