import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.PGHOST ?? "localhost",
    port: Number(process.env.PGPORT ?? "5432"),
    user: process.env.PGUSER ?? "aditya",
    password: process.env.PGPASSWORD ?? "postgres",
    database: process.env.PGDATABASE ?? "provue_tara",
    ssl: false,
  },
});
