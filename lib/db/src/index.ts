import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const hasDatabase = Boolean(process.env.DATABASE_URL);
export const pool = hasDatabase ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
export const db = hasDatabase ? drizzle(pool!, { schema }) : ({} as never);

export * from "./schema";
