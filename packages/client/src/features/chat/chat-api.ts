import type { ChatResponse, SendMessageRequest } from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const chatApi = {
  getConversation: (friendId: string): Promise<ChatResponse> =>
    api.get<ChatResponse>(`/chat/${friendId}`),
  sendMessage: (friendId: string, body: string): Promise<ChatResponse> =>
    api.post<ChatResponse>(`/chat/${friendId}`, { body } satisfies SendMessageRequest),
};
