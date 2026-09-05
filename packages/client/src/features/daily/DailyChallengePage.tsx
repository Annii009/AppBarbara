import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { History, Sparkles } from "lucide-react";
import {
  currentGameDay,
  DAILY_GAME_IDS,
  type CompleteDailyRequest,
  type DailyLeaderboardResponse,
  type DailyStatus,
  type GameId,
} from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import { ApiRequestError } from "../../lib/api.ts";
import { GAME_LABELS } from "../games/game-meta.ts";
import { dailyApi } from "./daily-api.ts";
import { DailyMemoryPlay } from "./plays/DailyMemoryPlay.tsx";
import { DailyMinesweeperPlay } from "./plays/DailyMinesweeperPlay.tsx";
import { DailySimonPlay } from "./plays/DailySimonPlay.tsx";
import { DailySlidePuzzlePlay } from "./plays/DailySlidePuzzlePlay.tsx";
import { DailySudokuPlay } from "./plays/DailySudokuPlay.tsx";
import { DailyTriviaPlay } from "./plays/DailyTriviaPlay.tsx";
import { DailyTwenty48Play } from "./plays/DailyTwenty48Play.tsx";
import { DailyWordGuessPlay } from "./plays/DailyWordGuessPlay.tsx";
import { DailyWordSearchPlay } from "./plays/DailyWordSearchPlay.tsx";
import "../games/sudoku/SudokuGamePage.css";
import "./DailyChallengePage.css";

/**
 * Reto diario de UN juego concreto (gameId en la ruta /daily/:gameId) — cada
 * uno de los 5 minijuegos tiene su propio reto simultaneo, su propia racha y
 * su propio ranking, todos con la misma semilla del dia
 * (dailySeed(gameId, gameDay) en packages/shared/src/seed.ts). Esta pagina
 * solo hace de cascaron: delega el juego en si en el componente Daily*Play
 * que toque, y ese componente avisa con onComplete() en cuanto se resuelve,
 * momento en el que aqui se le anade el gameId y se llama a la API (que es
 * quien de verdad valida la partida, ver
 * packages/server/src/modules/daily/daily.service.ts).
 */

function isDailyGameId(value: string | undefined): value is GameId {
  return DAILY_GAME_IDS.includes(value as GameId);
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type LoadState = "loading" | "ready";

export function DailyChallengePage(): React.JSX.Element {
  const navigate = useNavigate();
  const { gameId: rawGameId } = useParams<{ gameId: string }>();
  const gameDay = currentGameDay();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [leaderboard, setLeaderboard] = useState<DailyLeaderboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);

  const gameId = isDailyGameId(rawGameId) ? rawGameId : null;

  useEffect(() => {
    if (!gameId) return;
    dailyApi
      .getStatus()
      .then((res) => setStatus(res.statuses.find((s) => s.gameId === gameId) ?? null))
      .catch((err: unknown) => {
        setError(
          err instanceof ApiRequestError ? err.message : "No se ha podido cargar el reto de hoy.",
        );
      })
      .finally(() => setLoadState("ready"));
  }, [gameId]);

  useEffect(() => {
    if (status?.completed) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [status?.completed]);

  useEffect(() => {
    if (!status?.completed || !gameId) return;
    dailyApi
      .getLeaderboard(gameId)
      .then(setLeaderboard)
      .catch(() => setLeaderboard(null));
  }, [status?.completed, gameId]);

  async function handleComplete(
    payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">,
  ): Promise<void> {
    if (!gameId) return;
    setSubmitting(true);
    setError(null);
    try {
      setStatus(await dailyApi.complete({ ...payload, gameId, elapsedMs: Date.now() - startedAt }));
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "No se ha podido guardar tu reto de hoy.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!gameId) {
    return (
      <GlamCard eyebrow="Reto diario" title="Juego no encontrado">
        <Button variant="ghost" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </GlamCard>
    );
  }

  if (loadState === "loading" || !status) {
    return <GlamCard eyebrow="Reto diario" title="Cargando…" />;
  }

  if (status.completed) {
    return (
      <GlamCard eyebrow={`Reto diario · ${GAME_LABELS[gameId]}`} title="¡Ya lo has hecho hoy!">
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

          <div className="daily-win-actions">
            <Button variant="ghost" onClick={() => navigate("/daily/history")}>
              <History size={16} aria-hidden="true" /> Ver historial
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Volver al inicio
            </Button>
          </div>
        </div>
      </GlamCard>
    );
  }

  const elapsedMs = now - startedAt;

  return (
    <GlamCard eyebrow={`Reto diario · ${GAME_LABELS[gameId]}`} title={formatElapsed(elapsedMs)}>
      {error && (
        <p className="daily-error" role="alert">
          {error}
        </p>
      )}
      {submitting && <p className="daily-play-subtitle">Guardando…</p>}

      {gameId === "sudoku" && <DailySudokuPlay gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "wordsearch" && (
        <DailyWordSearchPlay gameDay={gameDay} onComplete={handleComplete} />
      )}
      {gameId === "memory" && <DailyMemoryPlay gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "2048" && <DailyTwenty48Play gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "simon" && <DailySimonPlay gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "wordguess" && <DailyWordGuessPlay gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "minesweeper" && <DailyMinesweeperPlay gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "slidepuzzle" && <DailySlidePuzzlePlay gameDay={gameDay} onComplete={handleComplete} />}
      {gameId === "trivia" && <DailyTriviaPlay gameDay={gameDay} onComplete={handleComplete} />}

      <div className="sudoku-actions">
        <Button variant="ghost" onClick={() => navigate("/")}>
          Volver al inicio
        </Button>
      </div>
    </GlamCard>
  );
}
