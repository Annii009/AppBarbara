import { Router } from "express";
import type { AvatarConfig } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createAvatarService } from "./avatar.service.ts";

export const avatarRouter: Router = Router();

avatarRouter.patch("/avatar", requireAuth, (req, res, next) => {
  try {
    // requireAuth garantiza que req.userId esta presente si llegamos aqui.
    const avatar = createAvatarService(getDb()).updateAvatar(req.userId as string, req.body);
    res.json(avatar satisfies AvatarConfig);
  } catch (error) {
    next(error);
  }
});
