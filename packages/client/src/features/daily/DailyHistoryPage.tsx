import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DailyHistoryResponse } from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import { GAME_ICONS, GAME_LABELS } from "../games/game-meta.ts";
import { dailyApi } from "./daily-api.ts";
import "./DailyHistoryPage.css";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatDate(gameDay: string): string {
  const date = new Date(`${gameDay}T00:00:00Z`);
  const label = date.toLocaleDateString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Historial de los ultimos dias, al estilo de la pagina de estadisticas de
 * los juegos de LinkedIn: por cada dia, que juegos se completaron y en
 * cuanto tiempo, de los 5 retos simultaneos. Los datos vienen ya calculados
 * del servidor (GET /api/daily/history), incluidos los dias sin jugar.
 */
export function DailyHistoryPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [history, setHistory] = useState<DailyHistoryResponse | null>(null);

  useEffect(() => {
    dailyApi
      .getHistory()
      .then(setHistory)
      .catch(() => setHistory({ days: [] }));
  }, []);

  return (
    <GlamCard eyebrow="Reto diario" title="Tu historial" maxWidth="30rem">
      {history === null && <p className="daily-history-loading">Cargando…</p>}

      <ul className="daily-history-days">
        {history?.days.map((day) => {
          const completedCount = day.games.filter((g) => g.completed).length;
          return (
            <li key={day.gameDay} className="daily-history-day">
              <div className="daily-history-day-header">
                <span className="daily-history-date">{formatDate(day.gameDay)}</span>
                <span className="daily-history-day-count">
                  {completedCount} / {day.games.length}
                </span>
              </div>
              <ul className="daily-history-list">
                {day.games.map((entry) => {
                  const Icon = GAME_ICONS[entry.gameId];
                  return (
                    <li
                      key={entry.gameId}
                      className="daily-history-row"
                      data-completed={entry.completed}
                    >
                      <span className="daily-history-game">
                        <Icon size={15} aria-hidden="true" />
                        {GAME_LABELS[entry.gameId]}
                      </span>
                      <span className="daily-history-result">
                        {entry.completed && entry.elapsedMs !== null
                          ? formatElapsed(entry.elapsedMs)
                          : "—"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>

      <Button variant="ghost" onClick={() => navigate("/")}>
        Volver al inicio
      </Button>
    </GlamCard>
  );
}
