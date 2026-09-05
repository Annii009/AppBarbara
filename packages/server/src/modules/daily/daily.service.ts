import {
  currentGameDay,
  dailySeed,
  DAILY_GAME_IDS,
  type CompleteDailyRequest,
  type DailyHistoryResponse,
  type DailyLeaderboardResponse,
  type DailyStatus,
  type DailyStatusResponse,
  type Difficulty,
  type GameId,
} from "@minibarbara/shared";
import {
  DAILY_PAIR_COUNT,
  DAILY_PASS_THRESHOLD,
  DAILY_QUESTION_COUNT,
  DAILY_TARGET_ROUNDS,
  DAILY_TARGET_TILE,
  generateMemoryPuzzle,
  generateMinesweeperGrid,
  generateSimonSequence,
  generateSudokuPuzzle,
  generateWordSearchPuzzle,
  getMaxTile,
  hasRevealedMine,
  isBoardCleared,
  isKnownWord,
  isPassingScore,
  isSolutionCorrect,
  isSolved,
  isValidAttempt,
  isWinningGuess,
  MAX_ATTEMPTS,
  MINESWEEPER_COLS,
  MINESWEEPER_ROWS,
  pickDailyQuestions,
  pickDailyWordSearchTheme,
  pickSecretWord,
  replayGame2048,
  replaySlidePuzzle,
  scoreAnswers,
  type Direction,
  type SimonButton,
  type SlideDirection,
} from "@minibarbara/games";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { createFriendsRepo } from "../friends/friends.repo.ts";
import { createDailyRepo } from "./daily.repo.ts";

/** Cuando el reto de hoy es sudoku, siempre en dificultad media. */
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
 * Racha de dias consecutivos DE UN JUEGO CONCRETO. Si hoy todavia no esta
 * hecho, se cuenta hasta ayer: no queremos que la racha parezca rota solo
 * porque la jugadora aun no ha entrado hoy.
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
 * hoy de ESE juego, regenerado a partir de la semilla del dia (nunca se
 * guarda ningun puzzle, ver seed.ts). Lanza ApiError.badRequest si no
 * cuadra. Cada rama usa el mismo motor que ya usa el cliente para jugar, asi
 * que no hay logica de verificacion duplicada en ningun sitio.
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

    case "wordguess": {
      const guesses = payload.guesses;
      if (!Array.isArray(guesses) || guesses.length === 0 || guesses.length > MAX_ATTEMPTS) {
        throw ApiError.badRequest("Falta o no es valido el historial de intentos.");
      }
      if (!guesses.every((guess) => isKnownWord(guess))) {
        throw ApiError.badRequest("Alguno de los intentos no es una palabra valida.");
      }
      const secret = pickSecretWord(dailySeed("wordguess", gameDay));
      const lastGuess = guesses[guesses.length - 1] as string;
      if (!isWinningGuess(secret, lastGuess)) {
        throw ApiError.badRequest("Todavia no has adivinado la palabra de hoy.");
      }
      return;
    }

    case "minesweeper": {
      const revealed = payload.revealed;
      const validShape =
        Array.isArray(revealed) &&
        revealed.every(
          (index) => Number.isInteger(index) && index >= 0 && index < MINESWEEPER_ROWS * MINESWEEPER_COLS,
        );
      if (!validShape) {
        throw ApiError.badRequest("Falta o no es valida la lista de casillas descubiertas.");
      }
      const grid = generateMinesweeperGrid(dailySeed("minesweeper", gameDay));
      const revealedSet = new Set(revealed);
      if (hasRevealedMine(grid, revealedSet) || !isBoardCleared(grid, revealedSet)) {
        throw ApiError.badRequest("Todavia no has despejado el tablero de hoy.");
      }
      return;
    }

    case "slidepuzzle": {
      if (!payload.moves || !payload.moves.every((move) => DIRECTIONS.has(move))) {
        throw ApiError.badRequest("Falta o no es valido el historial de movimientos.");
      }
      const grid = replaySlidePuzzle(dailySeed("slidepuzzle", gameDay), payload.moves as SlideDirection[]);
      if (!isSolved(grid)) {
        throw ApiError.badRequest("Ese historial de movimientos no deja el puzzle resuelto.");
      }
      return;
    }

    case "trivia": {
      const answers = payload.answers;
      if (
        !Array.isArray(answers) ||
        answers.length !== DAILY_QUESTION_COUNT ||
        !answers.every((answer) => Number.isInteger(answer) && answer >= 0 && answer < 4)
      ) {
        throw ApiError.badRequest("Faltan o no son validas las respuestas del quiz de hoy.");
      }
      const questions = pickDailyQuestions(dailySeed("trivia", gameDay));
      const score = scoreAnswers(questions, answers);
      if (!isPassingScore(score)) {
        throw ApiError.badRequest(`Necesitas al menos ${DAILY_PASS_THRESHOLD} respuestas correctas de ${DAILY_QUESTION_COUNT}.`);
      }
      return;
    }
  }
}

export function createDailyService(db: Db) {
  const repo = createDailyRepo(db);
  const friendsRepo = createFriendsRepo(db);

  function buildStatus(userId: string, gameId: GameId, gameDay: string): DailyStatus {
    const result = repo.getResult(userId, gameId, gameDay);
    const streak = computeStreak(repo.listRecentGameDays(userId, gameId), gameDay);
    return {
      gameId,
      gameDay,
      completed: result !== undefined,
      elapsedMs: result?.elapsed_ms ?? null,
      streak,
    };
  }

  return {
    /** Estado de los 5 retos diarios de hoy, de una vez. */
    getStatus(userId: string): DailyStatusResponse {
      const gameDay = currentGameDay();
      return {
        gameDay,
        statuses: DAILY_GAME_IDS.map((gameId) => buildStatus(userId, gameId, gameDay)),
      };
    },

    completeDaily(userId: string, payload: CompleteDailyRequest): DailyStatus {
      const gameDay = currentGameDay();
      const gameId = payload.gameId;

      if (!DAILY_GAME_IDS.includes(gameId)) {
        throw ApiError.badRequest("Ese juego no tiene reto diario.");
      }

      if (repo.getResult(userId, gameId, gameDay)) {
        // Ya estaba completado hoy: no es un error, el reto es de una vez al
        // dia y simplemente no hay nada nuevo que guardar.
        return buildStatus(userId, gameId, gameDay);
      }

      verifyCompletion(gameId, gameDay, payload);

      repo.insertResult(userId, gameId, gameDay, payload.elapsedMs);
      return buildStatus(userId, gameId, gameDay);
    },

    /** Ranking de hoy de un juego concreto entre tu y tus amigas: solo quien
     *  ya lo ha completado hoy aparece, ordenado del tiempo mas rapido al
     *  mas lento. */
    getLeaderboard(userId: string, gameId: GameId): DailyLeaderboardResponse {
      const gameDay = currentGameDay();
      const ids = [userId, ...friendsRepo.listFriendIds(userId)];
      const rows = repo.listLeaderboard(ids, gameId, gameDay);

      return {
        gameId,
        gameDay,
        entries: rows.map((row) => ({
          nick: row.nick,
          elapsedMs: row.elapsed_ms,
          isMe: row.user_id === userId,
        })),
      };
    },

    /** Los ultimos `days` dias, con los 5 juegos de cada uno — el
     *  "historial" tipo LinkedIn Games. */
    getHistory(userId: string, days = 14): DailyHistoryResponse {
      const today = currentGameDay();
      const gameDays = Array.from({ length: days }, (_, i) => addDays(today, -i));
      const rows = repo.getResultsForGameDays(userId, gameDays);

      const resultsByDayAndGame = new Map<string, number>();
      for (const row of rows) {
        resultsByDayAndGame.set(`${row.game_day}:${row.game_id}`, row.elapsed_ms);
      }

      return {
        days: gameDays.map((gameDay) => ({
          gameDay,
          games: DAILY_GAME_IDS.map((gameId) => {
            const elapsedMs = resultsByDayAndGame.get(`${gameDay}:${gameId}`);
            return {
              gameId,
              completed: elapsedMs !== undefined,
              elapsedMs: elapsedMs ?? null,
            };
          }),
        })),
      };
    },
  };
}
