import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Flame, Gamepad2, UserRound, Users } from "lucide-react";
import type { DailyStatusResponse } from "@minibarbara/shared";
import { Button } from "../../components/Button.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import { AvatarRenderer } from "../avatar/AvatarRenderer.tsx";
import { GAME_ICONS, GAME_LABELS } from "../games/game-meta.ts";
import { dailyApi } from "./daily-api.ts";
import { DailyReminderBanner } from "./DailyReminderBanner.tsx";
import "./DailyHubPage.css";

/**
 * Pantalla de inicio: los 5 retos diarios (uno por minijuego, todos con la
 * misma fecha limite a medianoche UTC — ver currentGameDay en
 * packages/shared/src/seed.ts) como tarjetas, mas accesos a amigas, avatar y
 * la practica libre. Sustituye al antiguo mapa del mundo.
 */
export function DailyHubPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [status, setStatus] = useState<DailyStatusResponse | null>(null);

  useEffect(() => {
    dailyApi
      .getStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  function firstPendingRoute(): string {
    const pending = status?.statuses.find((s) => !s.completed);
    return `/daily/${pending?.gameId ?? status?.statuses[0]?.gameId ?? "sudoku"}`;
  }

  return (
    <div className="hub-shell">
      <header className="hub-header">
        <button type="button" className="hub-profile" onClick={() => navigate("/avatar")}>
          {profile && <AvatarRenderer avatar={profile.avatar} size={48} />}
          <span className="hub-profile-nick">{profile?.user.nick}</span>
        </button>
        <div className="hub-header-actions">
          <button type="button" className="hub-icon-btn" onClick={() => navigate("/friends")}>
            <Users size={20} aria-hidden="true" />
          </button>
          <button type="button" className="hub-icon-btn" onClick={() => navigate("/avatar")}>
            <UserRound size={20} aria-hidden="true" />
          </button>
        </div>
      </header>

      <DailyReminderBanner onPlay={() => navigate(firstPendingRoute())} />

      <section className="hub-section">
        <h2 className="hub-section-title">Retos de hoy</h2>
        <ul className="hub-daily-grid">
          {status?.statuses.map((entry) => {
            const Icon = GAME_ICONS[entry.gameId];
            return (
              <li key={entry.gameId} className="hub-daily-card" data-completed={entry.completed}>
                <div className="hub-daily-card-icon">
                  <Icon size={26} aria-hidden="true" />
                </div>
                <p className="hub-daily-card-label">{GAME_LABELS[entry.gameId]}</p>
                {entry.streak > 0 && (
                  <p className="hub-daily-card-streak">
                    <Flame size={13} aria-hidden="true" /> {entry.streak}
                  </p>
                )}
                {entry.completed ? (
                  <span className="hub-daily-card-done">
                    <CheckCircle2 size={16} aria-hidden="true" /> Hecho
                  </span>
                ) : (
                  <Button onClick={() => navigate(`/daily/${entry.gameId}`)}>Jugar</Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="hub-section">
        <Button variant="ghost" onClick={() => navigate("/games")}>
          <Gamepad2 size={16} aria-hidden="true" /> Practica libre
        </Button>
      </section>
    </div>
  );
}
