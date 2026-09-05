import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { applySlideMove, generateSlidePuzzle, isSolved, type SlideGrid } from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { directionForTileClick } from "./slide-helpers.ts";
import { SlidePuzzleBoard } from "./SlidePuzzleBoard.tsx";
import "./SlidePuzzleGamePage.css";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Puzzle deslizante (15-puzzle) en practica libre: se puede repetir sin
 *  limite. Ver la nota de alcance equivalente en SudokuGamePage.tsx. */
export function SlidePuzzleGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [grid, setGrid] = useState<SlideGrid | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  function startGame(): void {
    setGrid(generateSlidePuzzle(crypto.randomUUID()));
    setFinishedAt(null);
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  function handleTileClick(row: number, col: number): void {
    if (!grid || finishedAt) return;
    const direction = directionForTileClick(grid, row, col);
    if (!direction) return;

    const result = applySlideMove(grid, direction);
    if (!result.moved) return;
    setGrid(result.grid);
    if (isSolved(result.grid)) setFinishedAt(Date.now());
  }

  if (!grid) {
    return (
      <GlamCard eyebrow="Minijuego" title="Puzzle deslizante">
        <div className="slidepuzzle-intro">
          <p className="slidepuzzle-intro-text">
            Ordena las fichas del 1 al 15 deslizandolas hacia el hueco.
          </p>
          <Button onClick={startGame}>Jugar</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  const elapsedMs = (finishedAt ?? now) - (startedAt ?? now);

  return (
    <GlamCard eyebrow="Puzzle deslizante" title={finishedAt ? "¡Resuelto!" : formatElapsed(elapsedMs)}>
      <SlidePuzzleBoard grid={grid} disabled={Boolean(finishedAt)} onTileClick={handleTileClick} />

      {finishedAt && (
        <div className="slidepuzzle-win">
          <p className="slidepuzzle-win-message">
            <PartyPopper size={20} aria-hidden="true" /> Muy bien
          </p>
          <div className="slidepuzzle-actions">
            <Button onClick={startGame}>Jugar otra vez</Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Volver
            </Button>
          </div>
        </div>
      )}
    </GlamCard>
  );
}
