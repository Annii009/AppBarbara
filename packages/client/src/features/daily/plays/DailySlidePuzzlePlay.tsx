import { useMemo, useRef, useState } from "react";
import { applySlideMove, generateSlidePuzzle, isSolved, type SlideDirection, type SlideGrid } from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { directionForTileClick } from "../../games/slidepuzzle/slide-helpers.ts";
import { SlidePuzzleBoard } from "../../games/slidepuzzle/SlidePuzzleBoard.tsx";

interface DailySlidePuzzlePlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">) => void;
}

export function DailySlidePuzzlePlay({ gameDay, onComplete }: DailySlidePuzzlePlayProps): React.JSX.Element {
  const initial = useMemo(() => generateSlidePuzzle(dailySeed("slidepuzzle", gameDay)), [gameDay]);
  const [grid, setGrid] = useState<SlideGrid>(initial);
  const movesRef = useRef<SlideDirection[]>([]);

  function handleTileClick(row: number, col: number): void {
    const direction = directionForTileClick(grid, row, col);
    if (!direction) return;

    const result = applySlideMove(grid, direction);
    if (!result.moved) return;
    movesRef.current.push(direction);
    setGrid(result.grid);

    if (isSolved(result.grid)) {
      onComplete({ moves: movesRef.current });
    }
  }

  return <SlidePuzzleBoard grid={grid} disabled={false} onTileClick={handleTileClick} />;
}
