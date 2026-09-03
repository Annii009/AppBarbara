import type { Db } from "../../db/index.ts";
import type { AvatarRow } from "../avatar/avatar.repo.ts";

export interface UserRow {
  id: string;
  nick: string;
  nick_lower: string;
  password_hash: string;
  friend_code: string;
  created_at: string;
}

/** Capa de datos del modulo auth: unico sitio que conoce el SQL de estas tablas. */
export function createAuthRepo(db: Db) {
  const insertUser = db.prepare<
    [string, string, string, string, string, string]
  >(
    `INSERT INTO users (id, nick, nick_lower, password_hash, friend_code, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const insertAvatar = db.prepare<
    [string, string, string, string, string, string | null, string | null, string, string]
  >(
    `INSERT INTO avatars
       (user_id, skin_tone, hair_style, hair_color, outfit, accessory, makeup, background, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  return {
    findByNickLower(nickLower: string): UserRow | undefined {
      return db
        .prepare<[string], UserRow>("SELECT * FROM users WHERE nick_lower = ?")
        .get(nickLower);
    },

    findById(id: string): UserRow | undefined {
      return db.prepare<[string], UserRow>("SELECT * FROM users WHERE id = ?").get(id);
    },

    friendCodeExists(code: string): boolean {
      return (
        db.prepare<[string], { 1: 1 }>("SELECT 1 FROM users WHERE friend_code = ?").get(code) !==
        undefined
      );
    },

    getAvatar(userId: string): AvatarRow | undefined {
      return db
        .prepare<[string], AvatarRow>("SELECT * FROM avatars WHERE user_id = ?")
        .get(userId);
    },

    /** Crea usuario + avatar por defecto en una sola transaccion atomica. */
    insertUserWithAvatar(user: UserRow, avatar: AvatarRow): void {
      db.transaction(() => {
        insertUser.run(
          user.id,
          user.nick,
          user.nick_lower,
          user.password_hash,
          user.friend_code,
          user.created_at,
        );
        insertAvatar.run(
          avatar.user_id,
          avatar.skin_tone,
          avatar.hair_style,
          avatar.hair_color,
          avatar.outfit,
          avatar.accessory,
          avatar.makeup,
          avatar.background,
          avatar.updated_at,
        );
      })();
    },
  };
}

export type AuthRepo = ReturnType<typeof createAuthRepo>;
