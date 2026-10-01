import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "postgresql",
  dbCredentials: { url: process.env.NETLIFY_DB_URL ?? "postgresql://localhost/tessera" },
});
