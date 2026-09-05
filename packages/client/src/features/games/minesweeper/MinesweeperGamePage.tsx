import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  cellIndex,
  generateMinesweeperGrid,
  hasRevealedMine,
  isBoardCleared,
  revealFrom,
  type MinesweeperGrid,
} from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { MinesweeperBoard } from "./MinesweeperBoard.tsx";
import "./MinesweeperGamePage.css";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Buscaminas en practica libre: se puede repetir sin limite. Ver la nota
 *  de alcance equivalente en SudokuGamePage.tsx. */
export function MinesweeperGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [grid, setGrid] = useState<MinesweeperGrid | null>(null);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [exploded, setExploded] = useState(false);
  const [won, setWon] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  function startGame(): void {
    setGrid(generateMinesweeperGrid(crypto.randomUUID()));
    setRevealed(new Set());
    setExploded(false);
    setWon(false);
    setFinishedAt(null);
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  function handleReveal(row: number, col: number): void {
    if (!grid || finishedAt) return;
    const cell = grid[row]?.[col];
    if (!cell) return;

    if (cell.isMine) {
      setRevealed((prev) => new Set(prev).add(cellIndex(row, col)));
      setExploded(true);
      setFinishedAt(Date.now());
      return;
    }

    const next = revealFrom(grid, revealed, row, col);
    setRevealed(next);
    if (!hasRevealedMine(grid, next) && isBoardCleared(grid, next)) {
      setWon(true);
      setFinishedAt(Date.now());
    }
  }

  if (!grid) {
    return (
      <GlamCard eyebrow="Minijuego" title="Buscaminas">
        <div className="minesweeper-intro">
          <p className="minesweeper-intro-text">
            Descubre todas las casillas sin pisar ninguna mina. El numero te
            dice cuantas minas hay justo alrededor.
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
  const finished = won || exploded;

  return (
    <GlamCard eyebrow="Buscaminas" title={formatElapsed(elapsedMs)}>
      <MinesweeperBoard grid={grid} revealed={revealed} exploded={exploded} disabled={finished} onReveal={handleReveal} />

      {finished && (
        <div className="minesweeper-win">
          <p className="minesweeper-win-message">
            {won && <PartyPopper size={20} aria-hidden="true" />}
            {won ? "¡Tablero despejado!" : "Pisaste una mina"}
          </p>
          <div className="minesweeper-actions">
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
