import { randomUUID } from "node:crypto";
import { MESSAGE_MAX_LENGTH, type ChatMessage, type ChatResponse, type Friend } from "@minibarbara/shared";
import type { Db } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { createFriendsRepo } from "../friends/friends.repo.ts";
import { createChatRepo, type MessageRow } from "./chat.repo.ts";

function rowToMessage(row: MessageRow): ChatMessage {
  return { id: row.id, senderId: row.sender_id, body: row.body, createdAt: row.created_at };
}

export function createChatService(db: Db) {
  const repo = createChatRepo(db);
  const friendsRepo = createFriendsRepo(db);

  /** Solo se puede chatear con amigas: sin esto, cualquiera podria mandar
   *  mensajes a cualquier userId con solo saberlo. */
  function requireFriend(userId: string, friendId: string): Friend {
    const friend = friendsRepo.findFriend(userId, friendId);
    if (!friend) {
      throw ApiError.forbidden("Solo puedes chatear con tus amigas.");
    }
    return friend;
  }

  return {
    getConversation(userId: string, friendId: string): ChatResponse {
      const friend = requireFriend(userId, friendId);
      const messages = repo.listConversation(userId, friendId).map(rowToMessage);
      return { friend, messages };
    },

    sendMessage(userId: string, friendId: string, body: string): ChatResponse {
      const friend = requireFriend(userId, friendId);

      const trimmed = body.trim();
      if (trimmed.length === 0) {
        throw ApiError.badRequest("El mensaje no puede estar vacio.");
      }
      if (trimmed.length > MESSAGE_MAX_LENGTH) {
        throw ApiError.badRequest(`El mensaje no puede superar los ${MESSAGE_MAX_LENGTH} caracteres.`);
      }

      repo.insertMessage(randomUUID(), userId, friendId, trimmed);
      const messages = repo.listConversation(userId, friendId).map(rowToMessage);
      return { friend, messages };
    },
  };
}
