import type { CompleteNodeRequest, ProgressResponse } from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const mapApi = {
  getProgress: (): Promise<ProgressResponse> => api.get<ProgressResponse>("/progress"),
  completeNode: (nodeId: string): Promise<ProgressResponse> =>
    api.post<ProgressResponse>("/progress/complete", { nodeId } satisfies CompleteNodeRequest),
};
