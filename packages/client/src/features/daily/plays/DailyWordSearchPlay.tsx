import { useMemo, useState } from "react";
import {
  cellsForPlacement,
  findMatchingPlacement,
  generateWordSearchPuzzle,
  pickDailyWordSearchTheme,
  type GridPosition,
} from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { WordSearchBoard } from "../../games/wordsearch/WordSearchBoard.tsx";
import "../../games/wordsearch/WordSearchGamePage.css";
import "../DailyChallengePage.css";

function cellKey(pos: GridPosition): string {
  return `${pos.row}-${pos.col}`;
}

interface DailyWordSearchPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">) => void;
}

export function DailyWordSearchPlay({ gameDay, onComplete }: DailyWordSearchPlayProps): React.JSX.Element {
  const theme = useMemo(() => pickDailyWordSearchTheme(gameDay), [gameDay]);
  const puzzle = useMemo(
    () => generateWordSearchPuzzle(dailySeed("wordsearch", gameDay), theme.words),
    [theme, gameDay],
  );
  const [foundWords, setFoundWords] = useState<ReadonlySet<string>>(new Set());
  const [done, setDone] = useState(false);

  const foundCells = useMemo(() => {
    const cells = new Set<string>();
    for (const placement of puzzle.placements) {
      if (!foundWords.has(placement.word)) continue;
      for (const cell of cellsForPlacement(placement)) cells.add(cellKey(cell));
    }
    return cells;
  }, [puzzle, foundWords]);

  function handleSelectionEnd(selection: GridPosition[]): void {
    if (done) return;
    const match = findMatchingPlacement(puzzle.placements, selection);
    if (!match || foundWords.has(match.word)) return;

    const next = new Set(foundWords);
    next.add(match.word);
    setFoundWords(next);

    if (next.size === puzzle.words.length) {
      setDone(true);
      onComplete({ foundWords: [...next] });
    }
  }

  return (
    <>
      <p className="daily-play-subtitle">Tema: {theme.label}</p>
      <WordSearchBoard grid={puzzle.grid} foundCells={foundCells} onSelectionEnd={handleSelectionEnd} />
      <ul className="wordsearch-word-list">
        {puzzle.words.map((word) => (
          <li key={word} data-found={foundWords.has(word)}>
            {word}
          </li>
        ))}
      </ul>
    </>
  );
}
