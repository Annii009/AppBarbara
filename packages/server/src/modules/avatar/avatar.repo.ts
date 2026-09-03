import type { AvatarConfig } from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";

export interface AvatarRow {
  user_id: string;
  skin_tone: string;
  hair_style: string;
  hair_color: string;
  outfit: string;
  accessory: string | null;
  makeup: string | null;
  background: string;
  updated_at: string;
}

/** Capa de datos de la tabla avatars. auth.repo la usa tambien al registrar. */
export function createAvatarRepo(db: Db) {
  const getStmt = db.prepare<[string], AvatarRow>("SELECT * FROM avatars WHERE user_id = ?");

  const updateStmt = db.prepare<
    [string, string, string, string, string | null, string | null, string, string, string]
  >(
    `UPDATE avatars
        SET skin_tone = ?, hair_style = ?, hair_color = ?, outfit = ?,
            accessory = ?, makeup = ?, background = ?, updated_at = ?
      WHERE user_id = ?`,
  );

  function getByUserId(userId: string): AvatarRow | undefined {
    return getStmt.get(userId);
  }

  return {
    getByUserId,

    update(userId: string, avatar: AvatarConfig): AvatarRow {
      const updatedAt = new Date().toISOString();
      updateStmt.run(
        avatar.skinTone,
        avatar.hairStyle,
        avatar.hairColor,
        avatar.outfit,
        avatar.accessory,
        avatar.makeup,
        avatar.background,
        updatedAt,
        userId,
      );

      const row = getByUserId(userId);
      if (!row) {
        // update no afecto a ninguna fila: el userId no tiene avatar, lo que
        // solo puede pasar si se llama con un id de usuario inexistente.
        throw new Error(`Avatar de usuario ${userId} no encontrado tras actualizar`);
      }
      return row;
    },
  };
}
