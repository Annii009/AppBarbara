import type { AddFriendRequest, FriendsResponse } from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const friendsApi = {
  list: (): Promise<FriendsResponse> => api.get<FriendsResponse>("/friends"),
  addByCode: (friendCode: string): Promise<FriendsResponse> =>
    api.post<FriendsResponse>("/friends", { friendCode } satisfies AddFriendRequest),
};
