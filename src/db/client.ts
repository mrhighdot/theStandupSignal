import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

dotenv.config({ override: true });

function createDatabase(connectionString: string) {
  return drizzle({ client: mysql.createPool(connectionString) });
}

let database: ReturnType<typeof createDatabase> | undefined;

/** Returns a lazily-created database so health and static pages can boot before local configuration exists. */
export function getDb(): ReturnType<typeof createDatabase> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required to use Standup Signal's data routes.");
  if (!connectionString.startsWith("mysql://")) {
    throw new Error("DATABASE_URL must be a MySQL URL (for example, mysql://user:password@127.0.0.1:3306/standup_signal), not a SQLite file path.");
  }
  return database ?? (database = createDatabase(connectionString));
}
