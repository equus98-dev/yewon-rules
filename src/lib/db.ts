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

  private inTransaction: boolean = false;
  private batchStatements: any[] = [];

  async query(sql: string, params: any[] = []) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed === "BEGIN") {
      this.inTransaction = true;
      this.batchStatements = [];
      return { rows: [], rowCount: 0 };
    }
    if (trimmed === "COMMIT") {
      this.inTransaction = false;
      if (this.batchStatements.length > 0) {
        const results = await this.db.batch(this.batchStatements);
        this.batchStatements = [];
        return { rows: [], rowCount: results.length, batchResults: results };
      }
      return { rows: [], rowCount: 0 };
    }
    if (trimmed === "ROLLBACK") {
      this.inTransaction = false;
      this.batchStatements = [];
      return { rows: [], rowCount: 0 };
    }

    const safeParams = params.map(p => (p instanceof Date ? p.toISOString() : p));
    const stmt = this.db.prepare(this.convertSql(sql)).bind(...safeParams);
    
    if (this.inTransaction) {
      this.batchStatements.push(stmt);
      return { rows: [], rowCount: 0, _isBatched: true, stmtIndex: this.batchStatements.length - 1 };
    } else {
      const { results } = await stmt.all();
      return { rows: results || [], rowCount: results?.length || 0 };
    }
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
