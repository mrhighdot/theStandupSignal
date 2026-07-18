import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

function createDatabase(connectionString: string) {
  return drizzle({ client: mysql.createPool(connectionString) });
}

let database: ReturnType<typeof createDatabase> | undefined;

/** Returns a lazily-created database so health and static pages can boot before local configuration exists. */
export function getDb(): ReturnType<typeof createDatabase> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to use Standup Signal's data routes.");
  return database ?? (database = createDatabase(connectionString));
}
