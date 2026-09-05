import type { SlideGrid } from "@minibarbara/games";
import "./SlidePuzzleBoard.css";

interface SlidePuzzleBoardProps {
  grid: SlideGrid;
  disabled: boolean;
  onTileClick: (row: number, col: number) => void;
}

export function SlidePuzzleBoard({ grid, disabled, onTileClick }: SlidePuzzleBoardProps): React.JSX.Element {
  return (
    <div className="slidepuzzle-board">
      {grid.map((line, row) =>
        line.map((value, col) => (
          <button
            key={`${row}-${col}`}
            type="button"
            className="slidepuzzle-tile"
            data-blank={value === 0}
            disabled={disabled || value === 0}
            onClick={() => onTileClick(row, col)}
          >
            {value !== 0 && value}
          </button>
        )),
      )}
    </div>
  );
}
