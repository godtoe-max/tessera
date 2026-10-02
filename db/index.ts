import { drizzle } from "drizzle-orm/netlify-db";
import * as schema from "./schema";

/** Netlify configures the connection automatically for production and deploy-preview database branches. */
let database:ReturnType<typeof createDatabase>|undefined;
function createDatabase(){return drizzle({schema});}

/** Initialize only when a request needs data, so builds do not require runtime secrets. */
export function getDb(){return database??=createDatabase();}
