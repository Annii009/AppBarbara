import { isValidAvatarConfig, type AvatarConfig } from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { avatarRowToConfig } from "./avatar.mapper.ts";
import { createAvatarRepo } from "./avatar.repo.ts";

export function createAvatarService(db: Db) {
  const repo = createAvatarRepo(db);

  return {
    /**
     * `patch` llega como `unknown` porque es el body de una peticion HTTP:
     * nunca confiamos en que el cliente mande ids reales del catalogo.
     */
    updateAvatar(userId: string, patch: unknown): AvatarConfig {
      if (!isValidAvatarConfig(patch)) {
        throw ApiError.badRequest("La configuracion de avatar no es valida.", {
          avatar: "Alguna de las opciones elegidas no existe en el catalogo.",
        });
      }

      const row = repo.update(userId, patch);
      return avatarRowToConfig(row);
    },
  };
}
