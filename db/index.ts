import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

/** Netlify configures the connection automatically for production and deploy-preview database branches. */
export const db = drizzle({ schema });
