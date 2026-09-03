import type { Db } from "../../db/index.ts";

export function createProgressRepo(db: Db) {
  const listStmt = db.prepare<[string], { node_id: string }>(
    "SELECT node_id FROM progress WHERE user_id = ?",
  );
  // INSERT OR IGNORE: completar el mismo nodo dos veces no es un error, es
  // idempotente (la jugadora puede repetir un nivel ya superado).
  const insertStmt = db.prepare<[string, string]>(
    "INSERT OR IGNORE INTO progress (user_id, node_id) VALUES (?, ?)",
  );

  return {
    listCompletedNodeIds(userId: string): string[] {
      return listStmt.all(userId).map((row) => row.node_id);
    },
    markComplete(userId: string, nodeId: string): void {
      insertStmt.run(userId, nodeId);
    },
  };
}
