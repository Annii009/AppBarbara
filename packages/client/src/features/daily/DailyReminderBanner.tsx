import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import type { DailyStatus } from "@minibarbara/shared";
import { dailyApi } from "./daily-api.ts";
import "./DailyReminderBanner.css";

/**
 * Recordatorio del reto diario, en dos niveles:
 *  1. Un banner en el mapa, siempre que el reto de hoy siga sin hacer.
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

export function DailyReminderBanner(): React.JSX.Element | null {
  const navigate = useNavigate();
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [notifsEnabled, setNotifsEnabled] = useState(
    () => canUseNotifications() && Notification.permission === "granted",
  );

  useEffect(() => {
    dailyApi
      .getStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  useEffect(() => {
    if (!status || status.completed || !notifsEnabled) return;

    // Como mucho un aviso por dia, aunque se recargue la pagina varias veces.
    try {
      if (window.localStorage.getItem(NOTIFIED_TODAY_KEY) === status.gameDay) return;
      window.localStorage.setItem(NOTIFIED_TODAY_KEY, status.gameDay);
    } catch {
      // localStorage puede fallar (modo privado, cuota llena); en el peor
      // caso se avisa mas de una vez el mismo dia, no es grave.
    }

    new Notification("miniBarbara", {
      body: "Tu reto diario todavia te espera. ¡No pierdas la racha!",
    });
  }, [status, notifsEnabled]);

  async function enableNotifications(): Promise<void> {
    if (!canUseNotifications()) return;
    const permission = await Notification.requestPermission();
    setNotifsEnabled(permission === "granted");
  }

  if (!status || status.completed) return null;

  return (
    <div className="daily-reminder">
      <div className="daily-reminder-text">
        <strong>¡Tu reto diario te espera!</strong>
        {status.streak > 0 && (
          <span>
            {" "}
            Llevas {status.streak} {status.streak === 1 ? "dia" : "dias"} seguidos.
          </span>
        )}
      </div>
      <div className="daily-reminder-actions">
        <button type="button" className="daily-reminder-play" onClick={() => navigate("/daily")}>
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
