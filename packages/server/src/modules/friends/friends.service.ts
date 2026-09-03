import type { FriendsResponse } from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { createFriendsRepo } from "./friends.repo.ts";

export function createFriendsService(db: Db) {
  const repo = createFriendsRepo(db);

  return {
    listFriends(userId: string): FriendsResponse {
      return { friends: repo.listFriends(userId) };
    },

    addByCode(userId: string, rawCode: string): FriendsResponse {
      const code = rawCode.trim().toUpperCase();
      const other = repo.findByFriendCode(code);

      if (!other) {
        throw ApiError.notFound("No existe ninguna cuenta con ese codigo de amiga.");
      }
      if (other.id === userId) {
        throw ApiError.badRequest("Ese es tu propio codigo de amiga.");
      }

      // Si ya erais amigas, addFriendship no hace nada (INSERT OR IGNORE):
      // no es un error, simplemente no hay nada nuevo que guardar.
      repo.addFriendship(userId, other.id);
      return { friends: repo.listFriends(userId) };
    },
  };
}
