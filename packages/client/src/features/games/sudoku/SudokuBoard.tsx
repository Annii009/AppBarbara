import type { SudokuGrid } from "@minibarbara/games";
import "./SudokuBoard.css";

interface Selected {
  row: number;
  col: number;
}

interface SudokuBoardProps {
  /** Casillas de partida (0 = vacia). Sirve para saber que celdas son pistas fijas. */
  puzzle: SudokuGrid;
  /** Estado actual del jugador, pistas incluidas. */
  draft: SudokuGrid;
  /** Solucion real: sirve para "bloquear" una celda en cuanto el jugador la
   *  acierta, para que no la pueda pisar sin querer. */
  solution: SudokuGrid;
  conflicts: ReadonlySet<string>;
  selected: Selected | null;
  onSelect: (row: number, col: number) => void;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

export function SudokuBoard({
  puzzle,
  draft,
  solution,
  conflicts,
  selected,
  onSelect,
}: SudokuBoardProps): React.JSX.Element {
  return (
    <div className="sudoku-board" role="grid" aria-label="Tablero de sudoku">
      {draft.map((row, rowIndex) =>
        row.map((value, colIndex) => {
          const isGiven = puzzle[rowIndex]?.[colIndex] !== 0;
          const isCorrect = !isGiven && value !== 0 && value === solution[rowIndex]?.[colIndex];
          const isLocked = isGiven || isCorrect;
          const isSelected = selected?.row === rowIndex && selected.col === colIndex;
          const isConflict = conflicts.has(cellKey(rowIndex, colIndex));
          const isEcho =
            !isSelected && value !== 0 && !!selected && draft[selected.row]?.[selected.col] === value;

          return (
            <button
              key={cellKey(rowIndex, colIndex)}
              type="button"
              role="gridcell"
              className="sudoku-cell"
              data-given={isGiven}
              data-correct={isCorrect}
              data-selected={isSelected}
              data-conflict={isConflict}
              data-echo={isEcho}
              data-box-right={colIndex % 3 === 2 && colIndex !== 8}
              data-box-bottom={rowIndex % 3 === 2 && rowIndex !== 8}
              disabled={isLocked}
              aria-label={`Fila ${rowIndex + 1}, columna ${colIndex + 1}${value !== 0 ? `, valor ${value}` : ""}${isLocked ? ", bloqueada" : ""}`}
              onClick={() => onSelect(rowIndex, colIndex)}
            >
              {value !== 0 ? value : ""}
            </button>
          );
        }),
      )}
    </div>
  );
}
