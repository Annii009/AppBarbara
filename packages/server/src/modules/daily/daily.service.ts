import {
  currentGameDay,
  dailySeed,
  pickDailyGameId,
  type CompleteDailyRequest,
  type DailyHistoryEntry,
  type DailyHistoryResponse,
  type DailyLeaderboardResponse,
  type DailyStatus,
  type Difficulty,
  type GameId,
} from "@minibarbara/shared";
import {
  DAILY_PAIR_COUNT,
  DAILY_TARGET_ROUNDS,
  DAILY_TARGET_TILE,
  generateMemoryPuzzle,
  generateSimonSequence,
  generateSudokuPuzzle,
  generateWordSearchPuzzle,
  getMaxTile,
  isSolutionCorrect,
  isValidAttempt,
  pickDailyWordSearchTheme,
  replayGame2048,
  type Direction,
  type SimonButton,
} from "@minibarbara/games";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { createFriendsRepo } from "../friends/friends.repo.ts";
import { createDailyRepo } from "./daily.repo.ts";

/** Cuando el reto de hoy es sudoku, siempre en dificultad media: la
 *  variedad viene de alternar de juego (ver pickDailyGameId), no de variar
 *  tambien la dificultad. */
const DAILY_SUDOKU_DIFFICULTY: Difficulty = "medium";

const DIRECTIONS: ReadonlySet<string> = new Set(["up", "down", "left", "right"]);

/** Suma dias a un "dia de juego" (YYYY-MM-DD en UTC), sin depender de la
 *  zona horaria del servidor. */
function addDays(gameDay: string, delta: number): string {
  const date = new Date(`${gameDay}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/**
 * Racha de dias consecutivos. Si hoy todavia no esta hecho, se cuenta hasta
 * ayer: no queremos que la racha parezca rota solo porque la jugadora aun no
 * ha entrado hoy.
 */
function computeStreak(gameDays: readonly string[], today: string): number {
  const set = new Set(gameDays);
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/**
 * Comprueba que el envio de la partida coincide de verdad con el puzzle de
 * hoy, regenerado a partir de la semilla del dia (nunca se guarda ningun
 * puzzle, ver seed.ts). Lanza ApiError.badRequest si no cuadra. Cada rama
 * usa el mismo motor que ya usa el cliente para jugar, asi que no hay
 * logica de verificacion duplicada en ningun sitio.
 */
function verifyCompletion(gameId: GameId, gameDay: string, payload: CompleteDailyRequest): void {
  switch (gameId) {
    case "sudoku": {
      if (!payload.grid) {
        throw ApiError.badRequest("Falta la cuadricula resuelta.");
      }
      const { solution } = generateSudokuPuzzle(
        dailySeed("sudoku", gameDay),
        DAILY_SUDOKU_DIFFICULTY,
      );
      if (!isSolutionCorrect(payload.grid, solution)) {
        throw ApiError.badRequest("Esa no es la solucion correcta del reto de hoy.");
      }
      return;
    }

    case "wordsearch": {
      if (!payload.foundWords) {
        throw ApiError.badRequest("Faltan las palabras encontradas.");
      }
      const theme = pickDailyWordSearchTheme(gameDay);
      const puzzle = generateWordSearchPuzzle(dailySeed("wordsearch", gameDay), theme.words);
      const found = new Set(payload.foundWords);
      const allFound = found.size === puzzle.words.length && puzzle.words.every((word) => found.has(word));
      if (!allFound) {
        throw ApiError.badRequest("No has encontrado todas las palabras del reto de hoy.");
      }
      return;
    }

    case "memory": {
      if (typeof payload.matchedPairs !== "number") {
        throw ApiError.badRequest("Falta cuantas parejas se encontraron.");
      }
      const puzzle = generateMemoryPuzzle(dailySeed("memory", gameDay), DAILY_PAIR_COUNT);
      const totalPairs = puzzle.cards.length / 2;
      if (payload.matchedPairs < totalPairs) {
        throw ApiError.badRequest("Todavia no has encontrado todas las parejas de hoy.");
      }
      return;
    }

    case "2048": {
      if (!payload.moves || !payload.moves.every((move) => DIRECTIONS.has(move))) {
        throw ApiError.badRequest("Falta o no es valido el historial de movimientos.");
      }
      const result = replayGame2048(dailySeed("2048", gameDay), payload.moves as Direction[]);
      if (getMaxTile(result.grid) < DAILY_TARGET_TILE) {
        throw ApiError.badRequest(`Todavia no has llegado a la ficha ${DAILY_TARGET_TILE} de hoy.`);
      }
      return;
    }

    case "simon": {
      const attempt = payload.sequence;
      const isValidShape = Array.isArray(attempt) && attempt.every((v) => v === 0 || v === 1 || v === 2 || v === 3);
      if (!isValidShape) {
        throw ApiError.badRequest("Falta o no es valida la secuencia jugada.");
      }
      const target = generateSimonSequence(dailySeed("simon", gameDay), DAILY_TARGET_ROUNDS);
      if (
        (attempt as number[]).length < DAILY_TARGET_ROUNDS ||
        !isValidAttempt(target, attempt as SimonButton[])
      ) {
        throw ApiError.badRequest("Esa no es la secuencia completa de hoy.");
      }
      return;
    }
  }
}

export function createDailyService(db: Db) {
  const repo = createDailyRepo(db);
  const friendsRepo = createFriendsRepo(db);

  function buildStatus(userId: string, gameDay: string): DailyStatus {
    const result = repo.getResult(userId, gameDay);
    const streak = computeStreak(repo.listRecentGameDays(userId), gameDay);
    return {
      gameDay,
      gameId: pickDailyGameId(gameDay),
      completed: result !== undefined,
      elapsedMs: result?.elapsed_ms ?? null,
      streak,
    };
  }

  return {
    getStatus(userId: string): DailyStatus {
      return buildStatus(userId, currentGameDay());
    },

    completeDaily(userId: string, payload: CompleteDailyRequest): DailyStatus {
      const gameDay = currentGameDay();

      if (repo.getResult(userId, gameDay)) {
        // Ya estaba completado hoy: no es un error, el reto es de una vez al
        // dia y simplemente no hay nada nuevo que guardar.
        return buildStatus(userId, gameDay);
      }

      verifyCompletion(pickDailyGameId(gameDay), gameDay, payload);

      repo.insertResult(userId, gameDay, payload.elapsedMs);
      return buildStatus(userId, gameDay);
    },

    /** Ranking del dia entre tu y tus amigas: solo quien ya lo ha completado
     *  hoy aparece, ordenado del tiempo mas rapido al mas lento. */
    getLeaderboard(userId: string): DailyLeaderboardResponse {
      const gameDay = currentGameDay();
      const ids = [userId, ...friendsRepo.listFriendIds(userId)];
      const rows = repo.listLeaderboard(ids, gameDay);

      return {
        gameDay,
        entries: rows.map((row) => ({
          nick: row.nick,
          elapsedMs: row.elapsed_ms,
          isMe: row.user_id === userId,
        })),
      };
    },

    /** Los ultimos `days` dias, completados o no, con que juego tocaba cada
     *  uno — el "historial" tipo LinkedIn Games. */
    getHistory(userId: string, days = 14): DailyHistoryResponse {
      const today = currentGameDay();
      const gameDays = Array.from({ length: days }, (_, i) => addDays(today, -i));
      const resultsByDay = repo.getResultsForGameDays(userId, gameDays);

      const entries: DailyHistoryEntry[] = gameDays.map((gameDay) => {
        const elapsedMs = resultsByDay.get(gameDay);
        return {
          gameDay,
          gameId: pickDailyGameId(gameDay),
          completed: elapsedMs !== undefined,
          elapsedMs: elapsedMs ?? null,
        };
      });

      return { entries };
    },
  };
}
