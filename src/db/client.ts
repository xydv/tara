import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

export const pool = new Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? "5432"),
  user: process.env.PGUSER ?? "aditya",
  password: process.env.PGPASSWORD ?? "postgres",
  database: process.env.PGDATABASE ?? "provue_tara",
});

export const db = drizzle(pool, { schema });
