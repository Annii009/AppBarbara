import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import type { DailyStatusResponse } from "@minibarbara/shared";
import { dailyApi } from "./daily-api.ts";
import "./DailyReminderBanner.css";

/**
 * Recordatorio de los retos diarios pendientes, en dos niveles:
 *  1. Un banner en el inicio, mientras quede al menos uno de los 5 retos sin
 *     hacer hoy.
 *  2. Opcionalmente, una notificacion del navegador (Web Notification API,
 *     gratis, sin servicio externo) si la usuaria da permiso explicito.
 *
 * Limitacion honesta: esta notificacion solo puede dispararse mientras haya
 * una pestana de miniBarbara abierta (se comprueba al cargar la pagina). Un
 * aviso que llegue con la app cerrada del todo necesitaria Web Push de
 * verdad (service worker + claves VAPID) - tambien gratuito, pero mas
 * infraestructura; queda como mejora futura si hace falta.
 */

const NOTIFIED_TODAY_KEY = "mb_daily_notified_on";

function canUseNotifications(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

interface DailyReminderBannerProps {
  onPlay: () => void;
}

export function DailyReminderBanner({ onPlay }: DailyReminderBannerProps): React.JSX.Element | null {
  const [status, setStatus] = useState<DailyStatusResponse | null>(null);
  const [notifsEnabled, setNotifsEnabled] = useState(
    () => canUseNotifications() && Notification.permission === "granted",
  );

  useEffect(() => {
    dailyApi
      .getStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  const pendingCount = status?.statuses.filter((s) => !s.completed).length ?? 0;
  const bestStreak = status ? Math.max(0, ...status.statuses.map((s) => s.streak)) : 0;

  useEffect(() => {
    if (!status || pendingCount === 0 || !notifsEnabled) return;

    // Como mucho un aviso por dia, aunque se recargue la pagina varias veces.
    try {
      if (window.localStorage.getItem(NOTIFIED_TODAY_KEY) === status.gameDay) return;
      window.localStorage.setItem(NOTIFIED_TODAY_KEY, status.gameDay);
    } catch {
      // localStorage puede fallar (modo privado, cuota llena); en el peor
      // caso se avisa mas de una vez el mismo dia, no es grave.
    }

    new Notification("miniBarbara", {
      body:
        pendingCount === 1
          ? "Todavia te queda un reto diario. ¡No pierdas la racha!"
          : `Todavia te quedan ${pendingCount} retos diarios. ¡No pierdas la racha!`,
    });
  }, [status, pendingCount, notifsEnabled]);

  async function enableNotifications(): Promise<void> {
    if (!canUseNotifications()) return;
    const permission = await Notification.requestPermission();
    setNotifsEnabled(permission === "granted");
  }

  if (!status || pendingCount === 0) return null;

  return (
    <div className="daily-reminder">
      <div className="daily-reminder-text">
        <strong>
          {pendingCount === 1
            ? "¡Te queda un reto diario!"
            : `¡Te quedan ${pendingCount} retos diarios!`}
        </strong>
        {bestStreak > 0 && (
          <span>
            {" "}
            Tu mejor racha ahora mismo es de {bestStreak} {bestStreak === 1 ? "dia" : "dias"}.
          </span>
        )}
      </div>
      <div className="daily-reminder-actions">
        <button type="button" className="daily-reminder-play" onClick={onPlay}>
          Jugar ahora
        </button>
        {canUseNotifications() && !notifsEnabled && Notification.permission !== "denied" && (
          <button type="button" className="daily-reminder-notify" onClick={() => void enableNotifications()}>
            <Bell size={14} aria-hidden="true" /> Avísame cada día
          </button>
        )}
      </div>
    </div>
  );
}
