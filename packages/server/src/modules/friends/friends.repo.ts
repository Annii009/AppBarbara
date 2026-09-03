import type { Friend } from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";
import { avatarRowToConfig } from "../avatar/avatar.mapper.ts";
import type { AvatarRow } from "../avatar/avatar.repo.ts";

type FriendJoinRow = { id: string; nick: string; friend_code: string } & AvatarRow;

function rowToFriend(row: FriendJoinRow): Friend {
  return {
    id: row.id,
    nick: row.nick,
    friendCode: row.friend_code,
    avatar: avatarRowToConfig(row),
  };
}

const FRIEND_JOIN_SELECT = `
  SELECT u.id as id, u.nick as nick, u.friend_code as friend_code,
         a.user_id, a.skin_tone, a.hair_style, a.hair_color, a.outfit,
         a.accessory, a.makeup, a.background, a.updated_at
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    JOIN avatars a ON a.user_id = u.id
`;

export function createFriendsRepo(db: Db) {
  const findByCodeStmt = db.prepare<[string], { id: string; nick: string; friend_code: string }>(
    "SELECT id, nick, friend_code FROM users WHERE friend_code = ?",
  );

  const areFriendsStmt = db.prepare<[string, string], { 1: 1 }>(
    "SELECT 1 FROM friendships WHERE user_id = ? AND friend_id = ?",
  );

  const listFriendIdsStmt = db.prepare<[string], { friend_id: string }>(
    "SELECT friend_id FROM friendships WHERE user_id = ?",
  );

  const listFriendsStmt = db.prepare<[string], FriendJoinRow>(
    `${FRIEND_JOIN_SELECT} WHERE f.user_id = ? ORDER BY u.nick COLLATE NOCASE`,
  );

  const findFriendStmt = db.prepare<[string, string], FriendJoinRow>(
    `${FRIEND_JOIN_SELECT} WHERE f.user_id = ? AND f.friend_id = ?`,
  );

  // Se insertan las dos direcciones en la misma llamada porque una amistad
  // siempre es mutua: si A agrega a B, B tiene que poder ver a A tambien.
  const insertStmt = db.prepare<[string, string]>(
    "INSERT OR IGNORE INTO friendships (user_id, friend_id) VALUES (?, ?)",
  );

  return {
    findByFriendCode(code: string) {
      return findByCodeStmt.get(code);
    },

    areFriends(userId: string, otherId: string): boolean {
      return areFriendsStmt.get(userId, otherId) !== undefined;
    },

    listFriendIds(userId: string): string[] {
      return listFriendIdsStmt.all(userId).map((row) => row.friend_id);
    },

    listFriends(userId: string): Friend[] {
      return listFriendsStmt.all(userId).map(rowToFriend);
    },

    findFriend(userId: string, friendId: string): Friend | undefined {
      const row = findFriendStmt.get(userId, friendId);
      return row ? rowToFriend(row) : undefined;
    },

    addFriendship(userId: string, otherId: string): void {
      db.transaction(() => {
        insertStmt.run(userId, otherId);
        insertStmt.run(otherId, userId);
      })();
    },
  };
}

export type FriendsRepo = ReturnType<typeof createFriendsRepo>;
