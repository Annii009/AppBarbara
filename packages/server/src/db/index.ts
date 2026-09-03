import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { env } from "../config/env.ts";

/**
 * Conexion a SQLite y sistema de migraciones.
 *
 * Migraciones a mano en lugar de un ORM: son archivos .sql numerados que se
 * aplican en orden una sola vez. Es la opcion mas transparente (ves el SQL
 * exacto que corre), no anade dependencias y el dia que migremos a Postgres el
 * salto es leer los mismos archivos con otro driver.
 */

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "migrations",
);

export type Db = Database.Database;

let instance: Db | null = null;

/** Devuelve la conexion, creandola y migrandola la primera vez. */
export function getDb(): Db {
  if (instance) return instance;

  fs.mkdirSync(path.dirname(env.databasePath), { recursive: true });
  const db = new Database(env.databasePath);

  // WAL permite leer mientras se escribe: sin esto, con varias peticiones a la
  // vez el servidor se bloquea a si mismo.
  db.pragma("journal_mode = WAL");
  // SQLite NO comprueba las claves foraneas salvo que se active por conexion.
  db.pragma("foreign_keys = ON");
  // Espera hasta 5s si otra escritura tiene el lock en vez de fallar al momento.
  db.pragma("busy_timeout = 5000");

  runMigrations(db);
  instance = db;
  return db;
}

/** Cierra la conexion. Se usa al apagar el servidor y en los tests. */
export function closeDb(): void {
  instance?.close();
  instance = null;
}

function runMigrations(db: Db): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db
      .prepare<[], { name: string }>("SELECT name FROM _migrations")
      .all()
      .map((row) => row.name),
  );

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  const record = db.prepare("INSERT INTO _migrations (name) VALUES (?)");

  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    // Cada migracion es atomica: o se aplica entera o no se aplica. Sin esto,
    // una migracion que falla a mitad deja la base de datos en un estado que
    // ni esta migrado ni se puede volver a migrar.
    db.transaction(() => {
      db.exec(sql);
      record.run(file);
    })();

    console.log(`[db] migracion aplicada: ${file}`);
  }
}
