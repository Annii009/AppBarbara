import { Router } from "express";
import type {
  CompleteDailyRequest,
  DailyHistoryResponse,
  DailyLeaderboardResponse,
  DailyStatus,
} from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createDailyService } from "./daily.service.ts";

export const dailyRouter: Router = Router();

dailyRouter.get("/daily", requireAuth, (req, res, next) => {
  try {
    const status = createDailyService(getDb()).getStatus(req.userId as string);
    res.json(status satisfies DailyStatus);
  } catch (error) {
    next(error);
  }
});

dailyRouter.get("/daily/leaderboard", requireAuth, (req, res, next) => {
  try {
    const result = createDailyService(getDb()).getLeaderboard(req.userId as string);
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

/** Cual de los 5 posibles campos hace falta segun el juego de hoy, sin tener
 *  que saber aqui que juego es: basta con que venga alguno reconocible. */
function hasRecognizablePayload(body: CompleteDailyRequest): boolean {
  return (
    Array.isArray(body?.grid) ||
    Array.isArray(body?.foundWords) ||
    typeof body?.matchedPairs === "number" ||
    Array.isArray(body?.moves) ||
    Array.isArray(body?.sequence)
  );
}

dailyRouter.post("/daily/complete", requireAuth, (req, res, next) => {
  try {
    const body = req.body as CompleteDailyRequest;
    if (!hasRecognizablePayload(body) || typeof body?.elapsedMs !== "number") {
      throw ApiError.badRequest("Faltan datos de la partida.");
    }

    const status = createDailyService(getDb()).completeDaily(req.userId as string, body);
    res.json(status satisfies DailyStatus);
  } catch (error) {
    next(error);
  }
});
