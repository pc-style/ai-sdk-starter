import { db, Account } from './schema';
import { randomUUID } from 'crypto';

export class AccountsDB {
  static create(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Account {
    const now = Date.now();
    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO accounts (id, provider, email, name, access_token, refresh_token, token_expiry, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      account.provider,
      account.email,
      account.name || null,
      account.access_token,
      account.refresh_token || null,
      account.token_expiry || null,
      now,
      now
    );

    return this.getById(id)!;
  }

  static getById(id: string): Account | undefined {
    const stmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
    return stmt.get(id) as Account | undefined;
  }

  static getByEmail(email: string): Account | undefined {
    const stmt = db.prepare('SELECT * FROM accounts WHERE email = ?');
    return stmt.get(email) as Account | undefined;
  }

  static getAll(): Account[] {
    const stmt = db.prepare('SELECT * FROM accounts ORDER BY created_at DESC');
    return stmt.all() as Account[];
  }

  static updateTokens(id: string, accessToken: string, refreshToken?: string, expiresIn?: number): void {
    const now = Date.now();
    const tokenExpiry = expiresIn ? now + (expiresIn * 1000) : null;

    const stmt = db.prepare(`
      UPDATE accounts
      SET access_token = ?, refresh_token = ?, token_expiry = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(accessToken, refreshToken || null, tokenExpiry, now, id);
  }

  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM accounts WHERE id = ?');
    stmt.run(id);
  }
}
