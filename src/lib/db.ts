import { getRequestContext } from "@cloudflare/next-on-pages";

export function getD1() {
  const ctx = getRequestContext();
  const env = ctx?.env as any;
  if (!env || !env.DB) {
    const keys = env ? Object.keys(env).join(', ') : 'env is undefined';
    throw new Error(`D1 Database binding 'DB' not found in edge environment. Available bindings: ${keys}`);
  }
  return env.DB;
}

// A wrapper to make D1 behave similarly to pg.Pool for easy migration
class D1PoolWrapper {
  private db: any;
  constructor(db: any) {
    this.db = db;
  }
  
  // Converts $1, $2 to ?1, ?2 for SQLite, and NOW() to CURRENT_TIMESTAMP
  private convertSql(sql: string) {
    let newSql = sql.replace(/\$(\d+)/g, '?$1');
    newSql = newSql.replace(/NOW\(\)/gi, "CURRENT_TIMESTAMP");
    newSql = newSql.replace(/ILIKE/gi, "LIKE");
    // SQLite doesn't support RETURNING * in older versions, but D1 does.
    return newSql;
  }

  async query(sql: string, params: any[] = []) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed === "BEGIN" || trimmed === "COMMIT" || trimmed === "ROLLBACK") {
      // Ignore transaction statements as D1 interactive transactions are not supported.
      // This means queries will run sequentially without atomic guarantees,
      // which is acceptable for this single-admin CMS application.
      return { rows: [], rowCount: 0 };
    }

    const safeParams = params.map(p => (p instanceof Date ? p.toISOString() : p));
    const stmt = this.db.prepare(this.convertSql(sql)).bind(...safeParams);
    const { results } = await stmt.all();
    return { rows: results || [], rowCount: results?.length || 0 };
  }

  async connect() {
    return {
      query: this.query.bind(this),
      release: () => {}, // No-op
    };
  }

  async end() {
    // No-op
  }
}

export function createPool() {
  const db = getD1();
  return new D1PoolWrapper(db);
}
