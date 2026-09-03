import type { AvatarConfig } from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const avatarApi = {
  update: (avatar: AvatarConfig): Promise<AvatarConfig> => api.patch<AvatarConfig>("/avatar", avatar),
};
