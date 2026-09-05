import { useMemo, useState } from "react";
import {
  generateMinesweeperGrid,
  hasRevealedMine,
  isBoardCleared,
  revealFrom,
} from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { Button } from "../../../components/Button.tsx";
import { MinesweeperBoard } from "../../games/minesweeper/MinesweeperBoard.tsx";
import "../../games/minesweeper/MinesweeperGamePage.css";
import "../DailyChallengePage.css";

interface DailyMinesweeperPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">) => void;
}

export function DailyMinesweeperPlay({ gameDay, onComplete }: DailyMinesweeperPlayProps): React.JSX.Element {
  const grid = useMemo(() => generateMinesweeperGrid(dailySeed("minesweeper", gameDay)), [gameDay]);
  const [revealed, setRevealed] = useState<ReadonlySet<number>>(new Set());
  const [exploded, setExploded] = useState(false);

  function restart(): void {
    setRevealed(new Set());
    setExploded(false);
  }

  function handleReveal(row: number, col: number): void {
    if (exploded) return;
    const cell = grid[row]?.[col];
    if (!cell) return;

    if (cell.isMine) {
      setExploded(true);
      return;
    }

    const next = revealFrom(grid, revealed, row, col);
    setRevealed(next);
    if (!hasRevealedMine(grid, next) && isBoardCleared(grid, next)) {
      onComplete({ revealed: [...next] });
    }
  }

  if (exploded) {
    return (
      <div className="daily-play-stuck">
        <p className="daily-play-subtitle">Pisaste una mina.</p>
        <Button variant="ghost" onClick={restart}>
          Intentarlo de nuevo
        </Button>
      </div>
    );
  }

  return <MinesweeperBoard grid={grid} revealed={revealed} exploded={false} disabled={false} onReveal={handleReveal} />;
}
