import { Router } from "express";
import { DAILY_GAME_IDS, type CompleteDailyRequest, type DailyHistoryResponse, type DailyLeaderboardResponse, type DailyStatus, type DailyStatusResponse, type GameId } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createDailyService } from "./daily.service.ts";

export const dailyRouter: Router = Router();

/** Interpreta ?gameId=... de la query, comprobando que sea uno reconocido
 *  antes de fiarse de el en cualquier consulta. */
function parseGameId(value: unknown): GameId {
  if (typeof value !== "string" || !DAILY_GAME_IDS.includes(value as GameId)) {
    throw ApiError.badRequest("Falta o no es valido el parametro gameId.");
  }
  return value as GameId;
}

dailyRouter.get("/daily", requireAuth, (req, res, next) => {
  try {
    const status = createDailyService(getDb()).getStatus(req.userId as string);
    res.json(status satisfies DailyStatusResponse);
  } catch (error) {
    next(error);
  }
});

dailyRouter.get("/daily/leaderboard", requireAuth, (req, res, next) => {
  try {
    const gameId = parseGameId(req.query["gameId"]);
    const result = createDailyService(getDb()).getLeaderboard(req.userId as string, gameId);
    res.json(result satisfies DailyLeaderboardResponse);
  } catch (error) {
    next(error);
  }
});

dailyRouter.get("/daily/history", requireAuth, (req, res, next) => {
  try {
    const result = createDailyService(getDb()).getHistory(req.userId as string);
    res.json(result satisfies DailyHistoryResponse);
  } catch (error) {
    next(error);
  }
});

/** Cual de los 5 posibles campos hace falta segun el juego, sin tener que
 *  saber aqui la forma exacta: basta con que venga alguno reconocible. */
function hasRecognizablePayload(body: CompleteDailyRequest): boolean {
  return (
    Array.isArray(body?.grid) ||
    Array.isArray(body?.foundWords) ||
    typeof body?.matchedPairs === "number" ||
    Array.isArray(body?.moves) ||
    Array.isArray(body?.sequence) ||
    Array.isArray(body?.guesses) ||
    Array.isArray(body?.revealed) ||
    Array.isArray(body?.answers)
  );
}

dailyRouter.post("/daily/complete", requireAuth, (req, res, next) => {
  try {
    const body = req.body as CompleteDailyRequest;
    if (
      typeof body?.gameId !== "string" ||
      !DAILY_GAME_IDS.includes(body.gameId as GameId) ||
      typeof body?.elapsedMs !== "number" ||
      !hasRecognizablePayload(body)
    ) {
      throw ApiError.badRequest("Faltan datos de la partida.");
    }

    const status = createDailyService(getDb()).completeDaily(req.userId as string, body);
    res.json(status satisfies DailyStatus);
  } catch (error) {
    next(error);
  }
});
