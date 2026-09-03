import { useMemo, useState, type KeyboardEvent } from "react";
import {
  countCorrectPlacements,
  findConflicts,
  generateSudokuPuzzle,
  isGridComplete,
  isSolutionCorrect,
  type SudokuGrid,
} from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest, type Difficulty } from "@minibarbara/shared";
import { NumberPad } from "../../games/sudoku/NumberPad.tsx";
import { SudokuBoard } from "../../games/sudoku/SudokuBoard.tsx";
import "../../games/sudoku/SudokuGamePage.css";

const DAILY_SUDOKU_DIFFICULTY: Difficulty = "medium";

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

interface DailySudokuPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs">) => void;
}

export function DailySudokuPlay({ gameDay, onComplete }: DailySudokuPlayProps): React.JSX.Element {
  const puzzle = useMemo(
    () => generateSudokuPuzzle(dailySeed("sudoku", gameDay), DAILY_SUDOKU_DIFFICULTY),
    [gameDay],
  );
  const [draft, setDraft] = useState<SudokuGrid>(() => puzzle.puzzle.map((row) => [...row]));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [done, setDone] = useState(false);

  const conflictKeys = useMemo(
    () => new Set(findConflicts(draft).map((c) => cellKey(c.row, c.col))),
    [draft],
  );

  const exhaustedValues = useMemo(() => {
    const exhausted = new Set<number>();
    for (let value = 1; value <= 9; value++) {
      if (countCorrectPlacements(draft, puzzle.solution, value) >= 9) exhausted.add(value);
    }
    return exhausted;
  }, [draft, puzzle.solution]);

  function setCellValue(value: number): void {
    if (!selected || done) return;

    const next = draft.map((row) => [...row]);
    const row = next[selected.row];
    if (!row) return;
    row[selected.col] = value;
    setDraft(next);

    if (isGridComplete(next) && isSolutionCorrect(next, puzzle.solution)) {
      setDone(true);
      onComplete({ grid: next });
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (!selected) return;
    if (event.key >= "1" && event.key <= "9") setCellValue(Number(event.key));
    else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") setCellValue(0);
  }

  return (
    <>
      <div className="sudoku-board-wrapper" onKeyDown={handleKeyDown}>
        <SudokuBoard
          puzzle={puzzle.puzzle}
          draft={draft}
          solution={puzzle.solution}
          conflicts={conflictKeys}
          selected={selected}
          onSelect={(row, col) => setSelected({ row, col })}
        />
      </div>
      <NumberPad
        onPick={(value) => setCellValue(value)}
        onErase={() => setCellValue(0)}
        disabled={!selected || done}
        exhaustedValues={exhaustedValues}
      />
    </>
  );
}
