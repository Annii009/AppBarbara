import type { LoginRequest, Profile, RegisterRequest } from "@minibarbara/shared";
import { api } from "../../lib/api.ts";

export const authApi = {
  me: (): Promise<Profile> => api.get<Profile>("/me"),
  register: (body: RegisterRequest): Promise<Profile> => api.post<Profile>("/auth/register", body),
  login: (body: LoginRequest): Promise<Profile> => api.post<Profile>("/auth/login", body),
  logout: (): Promise<void> => api.post<void>("/auth/logout"),
};
