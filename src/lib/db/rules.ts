import { db, EmailRule } from './schema';
import { randomUUID } from 'crypto';

export interface RuleConditions {
  from?: string[];
  subject?: string[];
  hasAttachment?: boolean;
}

export interface RuleActions {
  archive?: boolean;
  addLabel?: string;
  markAsRead?: boolean;
}

export class RulesDB {
  static create(
    accountId: string,
    name: string,
    conditions: RuleConditions,
    actions: RuleActions
  ): EmailRule {
    const now = Date.now();
    const id = randomUUID();

    const stmt = db.prepare(`
      INSERT INTO email_rules (id, account_id, name, conditions, actions, enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      accountId,
      name,
      JSON.stringify(conditions),
      JSON.stringify(actions),
      1,
      now
    );

    return this.getById(id)!;
  }

  static getById(id: string): EmailRule | undefined {
    const stmt = db.prepare('SELECT * FROM email_rules WHERE id = ?');
    return stmt.get(id) as EmailRule | undefined;
  }

  static getByAccount(accountId: string): EmailRule[] {
    const stmt = db.prepare('SELECT * FROM email_rules WHERE account_id = ? ORDER BY created_at DESC');
    return stmt.all(accountId) as EmailRule[];
  }

  static getEnabledByAccount(accountId: string): EmailRule[] {
    const stmt = db.prepare('SELECT * FROM email_rules WHERE account_id = ? AND enabled = 1 ORDER BY created_at DESC');
    return stmt.all(accountId) as EmailRule[];
  }

  static update(id: string, updates: Partial<Pick<EmailRule, 'name' | 'conditions' | 'actions' | 'enabled'>>): void {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.conditions !== undefined) {
      fields.push('conditions = ?');
      values.push(updates.conditions);
    }
    if (updates.actions !== undefined) {
      fields.push('actions = ?');
      values.push(updates.actions);
    }
    if (updates.enabled !== undefined) {
      fields.push('enabled = ?');
      values.push(updates.enabled ? 1 : 0);
    }

    if (fields.length === 0) return;

    values.push(id);
    const stmt = db.prepare(`UPDATE email_rules SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  static delete(id: string): void {
    const stmt = db.prepare('DELETE FROM email_rules WHERE id = ?');
    stmt.run(id);
  }
}
