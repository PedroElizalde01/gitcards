import "server-only";
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL!);

export interface User {
  id: string;
  login: string;
  name: string | null;
  token_enc: string | null;
  /** "<design>:<mode>", see pickTheme */
  theme: string;
  cal_start: string | null;
  counts: number[] | null;
  total: number;
  pass_token: string;
  pass_updated: Date;
  synced_at: Date | null;
  avatar: string | null;
  joined: string | null;
}

const COLS = "id::text, login, name, token_enc, theme, to_char(cal_start, 'YYYY-MM-DD') as cal_start, counts, total, pass_token, pass_updated, synced_at, avatar, to_char(joined, 'YYYY-MM-DD') as joined";

export async function getUser(id: string | number): Promise<User | null> {
  const rows = await sql.query(`select ${COLS} from users where id = $1`, [id]);
  return (rows[0] as User) ?? null;
}

export async function syncableUsers(): Promise<User[]> {
  return (await sql.query(`select ${COLS} from users where token_enc is not null order by synced_at nulls first`)) as User[];
}
