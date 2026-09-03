import { Router } from "express";
import type { AddFriendRequest, FriendsResponse } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createFriendsService } from "./friends.service.ts";

export const friendsRouter: Router = Router();

friendsRouter.get("/friends", requireAuth, (req, res, next) => {
  try {
    const result = createFriendsService(getDb()).listFriends(req.userId as string);
    res.json(result satisfies FriendsResponse);
  } catch (error) {
    next(error);
  }
});

friendsRouter.post("/friends", requireAuth, (req, res, next) => {
  try {
    const body = req.body as AddFriendRequest;
    if (typeof body?.friendCode !== "string" || body.friendCode.trim().length === 0) {
      throw ApiError.badRequest("Falta el codigo de amiga.");
    }

    const result = createFriendsService(getDb()).addByCode(req.userId as string, body.friendCode);
    res.status(201).json(result satisfies FriendsResponse);
  } catch (error) {
    next(error);
  }
});
