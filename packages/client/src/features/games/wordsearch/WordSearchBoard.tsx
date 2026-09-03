import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { straightLineBetween, type GridPosition, type LetterGrid } from "@minibarbara/games";
import "./WordSearchBoard.css";

interface WordSearchBoardProps {
  grid: LetterGrid;
  /** Celdas que pertenecen a una palabra ya encontrada; se quedan resaltadas. */
  foundCells: ReadonlySet<string>;
  onSelectionEnd: (selection: GridPosition[]) => void;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

/**
 * Detecta la celda bajo un punto de la pantalla leyendo sus atributos
 * data-row/data-col. Se usa un unico listener en el contenedor (en vez de
 * uno por celda) porque asi el mismo codigo sirve para arrastrar con raton y
 * con el dedo: los eventos "pointer" de React unifican ambos.
 */
function cellAtPoint(clientX: number, clientY: number): GridPosition | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
  const row = el?.dataset["row"];
  const col = el?.dataset["col"];
  if (row === undefined || col === undefined) return null;
  return { row: Number(row), col: Number(col) };
}

export function WordSearchBoard({
  grid,
  foundCells,
  onSelectionEnd,
}: WordSearchBoardProps): React.JSX.Element {
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState<GridPosition | null>(null);
  const [dragLine, setDragLine] = useState<GridPosition[]>([]);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    const cell = cellAtPoint(event.clientX, event.clientY);
    if (!cell) return;
    setDragStart(cell);
    setDragLine([cell]);
    boardRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>): void {
    if (!dragStart) return;
    const cell = cellAtPoint(event.clientX, event.clientY);
    if (!cell) return;
    const line = straightLineBetween(dragStart, cell);
    if (line) setDragLine(line);
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>): void {
    if (dragStart && dragLine.length > 0) onSelectionEnd(dragLine);
    setDragStart(null);
    setDragLine([]);
    if (boardRef.current?.hasPointerCapture(event.pointerId)) {
      boardRef.current.releasePointerCapture(event.pointerId);
    }
  }

  const dragKeys = new Set(dragLine.map((c) => cellKey(c.row, c.col)));
  const columns = grid[0]?.length ?? 1;

  return (
    <div
      ref={boardRef}
      className="wordsearch-board"
      role="grid"
      aria-label="Tablero de sopa de letras"
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {grid.map((row, rowIndex) =>
        row.map((letter, colIndex) => {
          const key = cellKey(rowIndex, colIndex);
          return (
            <span
              key={key}
              className="wordsearch-cell"
              role="gridcell"
              data-row={rowIndex}
              data-col={colIndex}
              data-dragging={dragKeys.has(key)}
              data-found={foundCells.has(key)}
            >
              {letter}
            </span>
          );
        }),
      )}
    </div>
  );
}
