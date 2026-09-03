import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { AvatarConfig, Profile } from "@minibarbara/shared";
import { ApiRequestError } from "../../lib/api.ts";
import { authApi } from "./auth-api.ts";

/**
 * Fuente de verdad de "quien ha iniciado sesion", compartida por toda la app.
 *
 * Al montar comprueba /api/me: si la cookie de sesion es valida, el servidor
 * devuelve el perfil; si no, un 401 que aqui tratamos como "nadie ha entrado
 * todavia" (no como un error que mostrar).
 */

type AuthStatus = "loading" | "ready";

interface AuthContextValue {
  profile: Profile | null;
  status: AuthStatus;
  login(nick: string, password: string): Promise<void>;
  register(nick: string, password: string): Promise<void>;
  logout(): Promise<void>;
  /** Actualiza el avatar del perfil en memoria tras guardarlo en el servidor. */
  setAvatar(avatar: AvatarConfig): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    authApi
      .me()
      .then(setProfile)
      .catch((error: unknown) => {
        if (!(error instanceof ApiRequestError) || error.status !== 401) {
          console.error("[auth] no se pudo comprobar la sesion:", error);
        }
        setProfile(null);
      })
      .finally(() => setStatus("ready"));
  }, []);

  const login = useCallback(async (nick: string, password: string) => {
    setProfile(await authApi.login({ nick, password }));
  }, []);

  const register = useCallback(async (nick: string, password: string) => {
    setProfile(await authApi.register({ nick, password }));
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setProfile(null);
  }, []);

  const setAvatar = useCallback((avatar: AvatarConfig) => {
    setProfile((prev) => (prev ? { ...prev, avatar } : prev));
  }, []);

  return (
    <AuthContext.Provider value={{ profile, status, login, register, logout, setAvatar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
