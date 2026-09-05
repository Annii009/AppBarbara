import { useEffect, useRef, useState, type KeyboardEvent } from "react";
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
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import type { Rng } from "@minibarbara/shared";
import { Button } from "../../../components/Button.tsx";
import { TwentyFortyEightBoard } from "../../games/twenty48/TwentyFortyEightBoard.tsx";
import "../../games/twenty48/TwentyFortyEightGamePage.css";
import "../DailyChallengePage.css";

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

interface DailyTwenty48PlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">) => void;
}

/**
 * Aunque el tablero inicial sale de la semilla del dia, la partida en si NO
 * es un unico camino fijo: cada ficha nueva depende de que movimientos se
 * hayan hecho antes (mismos movimientos -> mismo resultado, pero movimientos
 * distintos divergen). Por eso reiniciar si te quedas sin jugadas es
 * perfectamente valido: es una partida nueva, verificable igual que la
 * primera, sobre la misma semilla del dia.
 */
export function DailyTwenty48Play({ gameDay, onComplete }: DailyTwenty48PlayProps): React.JSX.Element {
  const rngRef = useRef<Rng | null>(null);
  const movesRef = useRef<Direction[]>([]);
  const [grid, setGrid] = useState<Grid2048 | null>(null);
  const [score, setScore] = useState(0);
  const [stuck, setStuck] = useState(false);

  function beginAttempt(): void {
    const { state, rng } = createInitialGame2048(dailySeed("2048", gameDay));
    rngRef.current = rng;
    movesRef.current = [];
    setGrid(state.grid);
    setScore(state.score);
    setStuck(false);
  }

  useEffect(() => {
    beginAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameDay]);

  function handleMove(direction: Direction): void {
    if (!grid || !rngRef.current || stuck) return;
    const result = applyMove(grid, direction);
    if (!result.moved) return;

    movesRef.current.push(direction);
    const nextGrid = spawnTile(result.grid, rngRef.current);
    setGrid(nextGrid);
    setScore((s) => s + result.scoreGained);

    if (getMaxTile(nextGrid) >= DAILY_TARGET_TILE) {
      onComplete({ moves: movesRef.current });
      return;
    }
    if (!hasMovesAvailable(nextGrid)) setStuck(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    const direction = KEY_TO_DIRECTION[event.key];
    if (direction) {
      event.preventDefault();
      handleMove(direction);
    }
  }

  if (!grid) return <p className="daily-play-subtitle">Preparando…</p>;

  return (
    <>
      <p className="daily-play-subtitle">
        {score} puntos · objetivo: llegar a {DAILY_TARGET_TILE}
      </p>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="twenty48-wrapper" tabIndex={0} autoFocus onKeyDown={handleKeyDown}>
        <TwentyFortyEightBoard grid={grid} onMove={handleMove} />
      </div>
      {stuck && (
        <div className="daily-play-stuck">
          <p className="daily-play-subtitle">
            Sin movimientos: hoy no se ha llegado a {DAILY_TARGET_TILE} en este intento.
          </p>
          <Button variant="ghost" onClick={beginAttempt}>
            Intentarlo de nuevo
          </Button>
        </div>
      )}
    </>
  );
}
