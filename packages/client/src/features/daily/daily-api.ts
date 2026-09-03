import type {
  CompleteDailyRequest,
  DailyHistoryResponse,
  DailyLeaderboardResponse,
  DailyStatus,
} from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const dailyApi = {
  getStatus: (): Promise<DailyStatus> => api.get<DailyStatus>("/daily"),
  complete: (body: CompleteDailyRequest): Promise<DailyStatus> =>
    api.post<DailyStatus>("/daily/complete", body),
  getLeaderboard: (): Promise<DailyLeaderboardResponse> =>
    api.get<DailyLeaderboardResponse>("/daily/leaderboard"),
  getHistory: (): Promise<DailyHistoryResponse> => api.get<DailyHistoryResponse>("/daily/history"),
};
