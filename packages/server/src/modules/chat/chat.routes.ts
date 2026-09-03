import { Router } from "express";
import type { ChatResponse, SendMessageRequest } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createChatService } from "./chat.service.ts";

export const chatRouter: Router = Router();

chatRouter.get("/chat/:friendId", requireAuth, (req, res, next) => {
  try {
    const friendId = req.params["friendId"] as string;
    const result = createChatService(getDb()).getConversation(req.userId as string, friendId);
    res.json(result satisfies ChatResponse);
  } catch (error) {
    next(error);
  }
});

chatRouter.post("/chat/:friendId", requireAuth, (req, res, next) => {
  try {
    const friendId = req.params["friendId"] as string;
    const body = req.body as SendMessageRequest;
    if (typeof body?.body !== "string") {
      throw ApiError.badRequest("Falta el mensaje.");
    }

    const result = createChatService(getDb()).sendMessage(req.userId as string, friendId, body.body);
    res.status(201).json(result satisfies ChatResponse);
  } catch (error) {
    next(error);
  }
});
