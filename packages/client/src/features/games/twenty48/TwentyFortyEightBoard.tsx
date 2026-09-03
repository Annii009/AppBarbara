import { useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Direction, Grid2048 } from "@minibarbara/games";
import "./TwentyFortyEightBoard.css";

interface TwentyFortyEightBoardProps {
  grid: Grid2048;
  onMove: (direction: Direction) => void;
}

const SWIPE_THRESHOLD_PX = 24;

/** Tablero de 2048: flechas de teclado (gestionadas por quien lo usa, via
 *  onKeyDown en un contenedor) y deslizar con el dedo o el raton, ambos
 *  resueltos aqui con la misma logica de arrastre que ya usa WordSearchBoard. */
export function TwentyFortyEightBoard({ grid, onMove }: TwentyFortyEightBoardProps): React.JSX.Element {
  const startPoint = useRef<{ x: number; y: number } | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    startPoint.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>): void {
    const start = startPoint.current;
    startPoint.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD_PX) return;

    if (Math.abs(dx) > Math.abs(dy)) {
      onMove(dx > 0 ? "right" : "left");
    } else {
      onMove(dy > 0 ? "down" : "up");
    }
  }

  return (
    <div
      className="twenty48-board"
      role="grid"
      aria-label="Tablero de 2048"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {grid.map((row, rowIndex) =>
        row.map((value, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className="twenty48-cell"
            data-value={value !== 0 ? value : undefined}
          >
            {value !== 0 ? value : ""}
          </div>
        )),
      )}
    </div>
  );
}
