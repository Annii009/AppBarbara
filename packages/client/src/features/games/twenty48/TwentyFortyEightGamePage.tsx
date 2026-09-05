import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
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
 * 2048 en practica libre: se puede repetir sin limite. Ver la nota de
 * alcance equivalente en SudokuGamePage.tsx.
 */
export function TwentyFortyEightGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [started, setStarted] = useState(false);
  const [grid, setGrid] = useState<Grid2048 | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
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
  }

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

  if (!started) {
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
            <Button onClick={startGame}>Jugar otra vez</Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Volver
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div className="twenty48-wrapper" tabIndex={0} autoFocus onKeyDown={handleKeyDown}>
            <TwentyFortyEightBoard grid={grid} onMove={handleMove} />
          </div>
          <div className="twenty48-actions">
            <Button variant="ghost" onClick={() => navigate("/")}>
              Salir
            </Button>
          </div>
        </>
      )}
    </GlamCard>
  );
}
