import type {
  CompleteDailyRequest,
  DailyHistoryResponse,
  DailyLeaderboardResponse,
  DailyStatus,
  DailyStatusResponse,
  GameId,
} from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const dailyApi = {
  getStatus: (): Promise<DailyStatusResponse> => api.get<DailyStatusResponse>("/daily"),
  complete: (body: CompleteDailyRequest): Promise<DailyStatus> =>
    api.post<DailyStatus>("/daily/complete", body),
  getLeaderboard: (gameId: GameId): Promise<DailyLeaderboardResponse> =>
    api.get<DailyLeaderboardResponse>(`/daily/leaderboard?gameId=${gameId}`),
  getHistory: (): Promise<DailyHistoryResponse> => api.get<DailyHistoryResponse>("/daily/history"),
};
