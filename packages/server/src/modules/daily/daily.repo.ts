import type { Db } from "../../db/index.ts";

export interface DailyResultRow {
  user_id: string;
  game_day: string;
  elapsed_ms: number;
  completed_at: string;
}

export function createDailyRepo(db: Db) {
  const getStmt = db.prepare<[string, string], DailyResultRow>(
    "SELECT * FROM daily_results WHERE user_id = ? AND game_day = ?",
  );
  // INSERT OR IGNORE: el reto es de una vez al dia. Si ya hay fila para ese
  // dia, esta llamada no hace nada (no sobreescribe un tiempo ya registrado).
  const insertStmt = db.prepare<[string, string, number]>(
    "INSERT OR IGNORE INTO daily_results (user_id, game_day, elapsed_ms) VALUES (?, ?, ?)",
  );
  // Un año de historial es de sobra: nadie va a tener una racha mas larga que
  // eso, y limitar la consulta evita leer una tabla que solo puede crecer.
  const recentDaysStmt = db.prepare<[string], { game_day: string }>(
    "SELECT game_day FROM daily_results WHERE user_id = ? ORDER BY game_day DESC LIMIT 400",
  );

  return {
    getResult(userId: string, gameDay: string): DailyResultRow | undefined {
      return getStmt.get(userId, gameDay);
    },
    insertResult(userId: string, gameDay: string, elapsedMs: number): void {
      insertStmt.run(userId, gameDay, elapsedMs);
    },
    listRecentGameDays(userId: string): string[] {
      return recentDaysStmt.all(userId).map((row) => row.game_day);
    },

    /**
     * Ranking de un dia concreto, limitado a una lista de ids (tipicamente
     * "yo + mis amigas"). El numero de placeholders varia segun cuantos ids
     * se pidan, asi que este statement se prepara al vuelo en vez de una vez
     * al crear el repo, a diferencia del resto.
     */
    listLeaderboard(
      userIds: readonly string[],
      gameDay: string,
    ): Array<{ user_id: string; nick: string; elapsed_ms: number }> {
      if (userIds.length === 0) return [];

      const placeholders = userIds.map(() => "?").join(", ");
      const stmt = db.prepare<
        unknown[],
        { user_id: string; nick: string; elapsed_ms: number }
      >(
        `SELECT d.user_id as user_id, u.nick as nick, d.elapsed_ms as elapsed_ms
           FROM daily_results d
           JOIN users u ON u.id = d.user_id
          WHERE d.game_day = ? AND d.user_id IN (${placeholders})
          ORDER BY d.elapsed_ms ASC`,
      );
      return stmt.all(gameDay, ...userIds);
    },

    /**
     * Resultados de una usuaria para una lista concreta de dias (para el
     * historial). Igual que listLeaderboard, el numero de placeholders
     * varia, asi que se prepara al vuelo.
     */
    getResultsForGameDays(userId: string, gameDays: readonly string[]): Map<string, number> {
      if (gameDays.length === 0) return new Map();

      const placeholders = gameDays.map(() => "?").join(", ");
      const stmt = db.prepare<unknown[], { game_day: string; elapsed_ms: number }>(
        `SELECT game_day, elapsed_ms FROM daily_results WHERE user_id = ? AND game_day IN (${placeholders})`,
      );
      const rows = stmt.all(userId, ...gameDays);
      return new Map(rows.map((row) => [row.game_day, row.elapsed_ms]));
    },
  };
}
