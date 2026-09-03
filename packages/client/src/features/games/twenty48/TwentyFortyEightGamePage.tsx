import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  applyMove,
  createInitialGame2048,
  DAILY_TARGET_TILE,
  getMaxTile,
  hasMovesAvailable,
  spawnTile,
  type Direction,
  type Grid2048,
} from "@minibarbara/games";
import type { Rng } from "@minibarbara/shared";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { mapApi } from "../../map/map-api.ts";
import { TwentyFortyEightBoard } from "./TwentyFortyEightBoard.tsx";
import "./TwentyFortyEightGamePage.css";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
};

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * 2048: junta fichas iguales hasta quedarte sin movimientos. Practica libre
 * y modo mapa (mismo patron que el resto, ver la nota en SudokuGamePage.tsx).
 * La partida diaria (con envio de la partida al servidor para verificarla de
 * verdad) vive en DailyChallengePage, no aqui.
 */
export function TwentyFortyEightGamePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get("node");
  const isNodeMode = nodeId !== null;

  const [started, setStarted] = useState(false);
  const [grid, setGrid] = useState<Grid2048 | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [nodeReported, setNodeReported] = useState(false);
  const rngRef = useRef<Rng | null>(null);

  useEffect(() => {
    if (!startedAt || gameOver) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, gameOver]);

  function startGame(): void {
    const seed = crypto.randomUUID();
    const { state, rng } = createInitialGame2048(seed);
    rngRef.current = rng;
    setGrid(state.grid);
    setScore(state.score);
    setGameOver(false);
    setStarted(true);
    setStartedAt(Date.now());
    setNow(Date.now());
    setNodeReported(false);
  }

  useEffect(() => {
    if (isNodeMode && !started) startGame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNodeMode]);

  useEffect(() => {
    if (gameOver && nodeId && !nodeReported) {
      setNodeReported(true);
      mapApi.completeNode(nodeId).catch((error: unknown) => {
        console.error("[map] no se pudo guardar el progreso de este nivel:", error);
      });
    }
  }, [gameOver, nodeId, nodeReported]);

  function handleMove(direction: Direction): void {
    if (!grid || !rngRef.current || gameOver) return;
    const result = applyMove(grid, direction);
    if (!result.moved) return;

    const nextGrid = spawnTile(result.grid, rngRef.current);
    setGrid(nextGrid);
    setScore((s) => s + result.scoreGained);
    if (!hasMovesAvailable(nextGrid)) setGameOver(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const direction = KEY_TO_DIRECTION[event.key];
    if (direction) {
      event.preventDefault();
      handleMove(direction);
    }
  }

  if (!isNodeMode && !started) {
    return (
      <GlamCard eyebrow="Minijuego" title="2048">
        <div className="twenty48-intro">
          <p className="twenty48-intro-text">
            Une fichas iguales para llegar lo mas lejos que puedas. Flechas del
            teclado o desliza con el dedo para mover.
          </p>
          <Button onClick={startGame}>Jugar</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  if (!grid) {
    return <GlamCard eyebrow="2048" title="Preparando…" />;
  }

  const elapsedMs = now - (startedAt ?? now);
  const maxTile = getMaxTile(grid);
  const reachedTarget = maxTile >= DAILY_TARGET_TILE;

  return (
    <GlamCard eyebrow={`2048 · ${score} puntos`} title={formatElapsed(elapsedMs)}>
      {gameOver ? (
        <div className="twenty48-win">
          <p className="twenty48-win-message">
            {reachedTarget && <PartyPopper size={20} aria-hidden="true" />}
            {reachedTarget ? "¡Muy bien!" : "Sin movimientos"}
          </p>
          <p className="twenty48-win-time">
            Puntuacion: {score} · Ficha maxima: {maxTile}
          </p>
          <div className="twenty48-actions">
            {isNodeMode ? (
              <>
                <Button onClick={() => navigate("/map")}>Volver al mapa</Button>
                <Button variant="ghost" onClick={startGame}>
                  Jugar otra vez
                </Button>
              </>
            ) : (
              <>
                <Button onClick={startGame}>Jugar otra vez</Button>
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Volver
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div className="twenty48-wrapper" tabIndex={0} autoFocus onKeyDown={handleKeyDown}>
            <TwentyFortyEightBoard grid={grid} onMove={handleMove} />
          </div>
          <div className="twenty48-actions">
            <Button
              variant="ghost"
              onClick={() => (isNodeMode ? navigate("/map") : navigate("/"))}
            >
              {isNodeMode ? "Volver al mapa" : "Salir"}
            </Button>
          </div>
        </>
      )}
    </GlamCard>
  );
}
