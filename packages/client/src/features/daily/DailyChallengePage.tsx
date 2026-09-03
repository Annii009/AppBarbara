import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History, Sparkles } from "lucide-react";
import {
  currentGameDay,
  type CompleteDailyRequest,
  type DailyLeaderboardResponse,
  type DailyStatus,
  type GameId,
} from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import { ApiRequestError } from "../../lib/api.ts";
import { dailyApi } from "./daily-api.ts";
import { DailyMemoryPlay } from "./plays/DailyMemoryPlay.tsx";
import { DailySimonPlay } from "./plays/DailySimonPlay.tsx";
import { DailySudokuPlay } from "./plays/DailySudokuPlay.tsx";
import { DailyTwenty48Play } from "./plays/DailyTwenty48Play.tsx";
import { DailyWordSearchPlay } from "./plays/DailyWordSearchPlay.tsx";
import "../games/sudoku/SudokuGamePage.css";
import "./DailyChallengePage.css";

/**
 * El reto diario alterna entre los 5 minijuegos segun el dia
 * (pickDailyGameId, en packages/shared/src/seed.ts) — cliente y servidor
 * calculan el mismo juego a partir de la misma fecha, sin que el servidor
 * tenga que avisar al cliente por adelantado. Esta pagina solo hace de
 * cascaron: delega el juego en si en el componente Daily*Play que toque, y
 * ese componente avisa con onComplete() en cuanto se resuelve, momento en el
 * que aqui se llama a la API (que es quien de verdad valida la partida, ver
 * packages/server/src/modules/daily/daily.service.ts).
 */

const GAME_LABELS: Record<GameId, string> = {
  sudoku: "Sudoku",
  wordsearch: "Sopa de letras",
  memory: "Memorama",
  "2048": "2048",
  simon: "Secuencia",
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type LoadState = "loading" | "ready";

export function DailyChallengePage(): React.JSX.Element {
  const navigate = useNavigate();
  const gameDay = currentGameDay();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dailyApi
      .getStatus()
      .then(setStatus)
      .catch((err: unknown) => {
        setError(
          err instanceof ApiRequestError ? err.message : "No se ha podido cargar el reto de hoy.",
        );
      })
      .finally(() => setLoadState("ready"));
  }, []);

  useEffect(() => {
    if (status?.completed) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status?.completed]);

  useEffect(() => {
    if (!status?.completed) return;
    dailyApi
      .getLeaderboard()
      .then(setLeaderboard)
      .catch(() => setLeaderboard(null));
  }, [status?.completed]);

  async function handleComplete(payload: Omit<CompleteDailyRequest, "elapsedMs">): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      setStatus(await dailyApi.complete({ ...payload, elapsedMs: Date.now() - startedAt }));
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "No se ha podido guardar tu reto de hoy.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadState === "loading" || !status) {
    return <GlamCard eyebrow="Reto diario" title="Cargando…" />;
  }

  if (status.completed) {
    return (
      <GlamCard eyebrow={`Reto diario · ${status.gameDay}`} title="¡Ya lo has hecho hoy!">
        <div className="daily-win">
          <p className="daily-win-message">
            <Sparkles size={20} aria-hidden="true" /> Vuelve mañana a por el siguiente
          </p>
          {status.elapsedMs !== null && (
            <p className="daily-win-time">Tu tiempo de hoy: {formatElapsed(status.elapsedMs)}</p>
          )}
          <p className="daily-win-streak">
            Racha actual: {status.streak} {status.streak === 1 ? "dia" : "dias"}
          </p>

          {leaderboard && leaderboard.entries.length > 0 && (
            <div className="daily-leaderboard">
              <p className="daily-leaderboard-title">Ranking de hoy</p>
              <ol className="daily-leaderboard-list">
                {leaderboard.entries.map((entry, index) => (
                  <li key={entry.nick} className="daily-leaderboard-row" data-mine={entry.isMe}>
                    <span className="daily-leaderboard-rank">{index + 1}</span>
                    <span className="daily-leaderboard-nick">{entry.nick}</span>
                    <span className="daily-leaderboard-time">{formatElapsed(entry.elapsedMs)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <Button variant="ghost" onClick={() => navigate("/daily/history")}>
            <History size={16} aria-hidden="true" /> Ver historial
          </Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver al mapa
          </Button>
        </div>
      </GlamCard>
    );
  }

  const elapsedMs = now - startedAt;

  return (
    <GlamCard eyebrow={`Reto diario · ${GAME_LABELS[status.gameId]}`} title={formatElapsed(elapsedMs)}>
      {error && (
        <p className="daily-error" role="alert">
          {error}
        </p>
      )}
      {submitting && <p className="daily-play-subtitle">Guardando…</p>}

      {status.gameId === "sudoku" && <DailySudokuPlay gameDay={gameDay} onComplete={handleComplete} />}
      {status.gameId === "wordsearch" && (
        <DailyWordSearchPlay gameDay={gameDay} onComplete={handleComplete} />
      )}
      {status.gameId === "memory" && <DailyMemoryPlay gameDay={gameDay} onComplete={handleComplete} />}
      {status.gameId === "2048" && <DailyTwenty48Play gameDay={gameDay} onComplete={handleComplete} />}
      {status.gameId === "simon" && <DailySimonPlay gameDay={gameDay} onComplete={handleComplete} />}

      <div className="sudoku-actions">
        <Button variant="ghost" onClick={() => navigate("/")}>
          Volver al mapa
        </Button>
      </div>
    </GlamCard>
  );
}
