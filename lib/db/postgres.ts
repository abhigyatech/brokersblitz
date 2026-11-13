import { Pool } from 'pg';
import type { QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

export function getDbPool(): Pool {
  if (!pool) {
    const connectionString =
      process.env.DATABASE_URL ||
      'postgresql://postgres.xlyyctbdyjbqyxlmfpei:BrokersBlitz2026@aws-0-ap-northeast-1.pooler.supabase.com:6543/brokersblitz';

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return pool;
}

export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const p = getDbPool();
  return p.query<T>(text, params);
}
