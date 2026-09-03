import { Router } from "express";
import type { CompleteNodeRequest, ProgressResponse } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createProgressService } from "./progress.service.ts";

export const progressRouter: Router = Router();

progressRouter.get("/progress", requireAuth, (req, res, next) => {
  try {
    const progress = createProgressService(getDb()).getProgress(req.userId as string);
    res.json(progress satisfies ProgressResponse);
  } catch (error) {
    next(error);
  }
});

progressRouter.post("/progress/complete", requireAuth, (req, res, next) => {
  try {
    const body = req.body as CompleteNodeRequest;
    if (typeof body?.nodeId !== "string" || body.nodeId.length === 0) {
      throw ApiError.badRequest("Falta el nivel que se ha completado.");
    }

    const progress = createProgressService(getDb()).completeNode(req.userId as string, body.nodeId);
    res.json(progress satisfies ProgressResponse);
  } catch (error) {
    next(error);
  }
});
