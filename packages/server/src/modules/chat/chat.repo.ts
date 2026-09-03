import type { Db } from "../../db/index.ts";

export interface MessageRow {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
}

export function createChatRepo(db: Db) {
  const listStmt = db.prepare<[string, string, string, string], MessageRow>(
    `SELECT * FROM messages
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC, rowid ASC`,
  );

  const insertStmt = db.prepare<[string, string, string, string]>(
    "INSERT INTO messages (id, sender_id, receiver_id, body) VALUES (?, ?, ?, ?)",
  );

  return {
    listConversation(userId: string, otherId: string): MessageRow[] {
      return listStmt.all(userId, otherId, otherId, userId);
    },
    insertMessage(id: string, senderId: string, receiverId: string, body: string): void {
      insertStmt.run(id, senderId, receiverId, body);
    },
  };
}
