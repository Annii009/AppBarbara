import { Bomb } from "lucide-react";
import { cellIndex, type MinesweeperGrid } from "@minibarbara/games";
import "./MinesweeperBoard.css";

interface MinesweeperBoardProps {
  grid: MinesweeperGrid;
  revealed: ReadonlySet<number>;
  /** Cuando se pisa una mina, se muestran todas para que se vea el tablero
   *  completo — como en el juego clasico. */
  exploded: boolean;
  disabled: boolean;
  onReveal: (row: number, col: number) => void;
}

const NUMBER_COLORS: Record<number, string> = {
  1: "#3a7bd5", 2: "#2fae7e", 3: "#e5484d", 4: "#7b4fbd",
  5: "#c8901a", 6: "#2b9aa3", 7: "#4a2540", 8: "#8a6079",
};

export function MinesweeperBoard({ grid, revealed, exploded, disabled, onReveal }: MinesweeperBoardProps): React.JSX.Element {
  const cols = grid[0]?.length ?? 8;

  return (
    <div className="minesweeper-board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {grid.map((line, row) =>
        line.map((cell, col) => {
          const index = cellIndex(row, col);
          const isRevealed = revealed.has(index) || (exploded && cell.isMine);
          return (
            <button
              key={index}
              type="button"
              className="minesweeper-cell"
              data-revealed={isRevealed}
              data-mine={isRevealed && cell.isMine}
              disabled={disabled || isRevealed}
              onClick={() => onReveal(row, col)}
              aria-label={`Casilla fila ${row + 1}, columna ${col + 1}`}
            >
              {isRevealed && cell.isMine && <Bomb size={16} aria-hidden="true" />}
              {isRevealed && !cell.isMine && cell.adjacentMines > 0 && (
                <span style={{ color: NUMBER_COLORS[cell.adjacentMines] }}>{cell.adjacentMines}</span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}
