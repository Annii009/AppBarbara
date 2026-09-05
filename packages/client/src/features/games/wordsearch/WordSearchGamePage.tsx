import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  cellsForPlacement,
  findMatchingPlacement,
  generateWordSearchPuzzle,
  WORD_SEARCH_THEMES,
  type GridPosition,
  type WordSearchPuzzle,
  type WordSearchTheme,
} from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { WordSearchBoard } from "./WordSearchBoard.tsx";
import "./WordSearchGamePage.css";

/** Sopa de letras en practica libre: picker de tema, se puede repetir sin
 *  limite. Ver la nota de alcance equivalente en SudokuGamePage.tsx. */

function cellKey(pos: GridPosition): string {
  return `${pos.row}-${pos.col}`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function WordSearchGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [theme, setTheme] = useState<WordSearchTheme | null>(null);
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [foundWords, setFoundWords] = useState<ReadonlySet<string>>(new Set());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  function startGame(nextTheme: WordSearchTheme): void {
    const seed = crypto.randomUUID();
    const nextPuzzle = generateWordSearchPuzzle(seed, nextTheme.words);

    setTheme(nextTheme);
    setPuzzle(nextPuzzle);
    setFoundWords(new Set());
    setFinishedAt(null);
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  const foundCells = useMemo(() => {
    const cells = new Set<string>();
    if (!puzzle) return cells;
    for (const placement of puzzle.placements) {
      if (!foundWords.has(placement.word)) continue;
      for (const cell of cellsForPlacement(placement)) cells.add(cellKey(cell));
    }
    return cells;
  }, [puzzle, foundWords]);

  function handleSelectionEnd(selection: GridPosition[]): void {
    if (!puzzle || finishedAt) return;

    const match = findMatchingPlacement(puzzle.placements, selection);
    if (!match || foundWords.has(match.word)) return;

    const next = new Set(foundWords);
    next.add(match.word);
    setFoundWords(next);

    if (next.size === puzzle.words.length) {
      setFinishedAt(Date.now());
    }
  }

  if (!theme || !puzzle) {
    return (
      <GlamCard eyebrow="Minijuego" title="Sopa de letras">
        <div className="wordsearch-theme-picker">
          <p className="wordsearch-intro">Elige un tema para empezar.</p>
          {WORD_SEARCH_THEMES.map((option) => (
            <Button key={option.id} onClick={() => startGame(option)}>
              {option.label}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  const elapsedMs = (finishedAt ?? now) - (startedAt ?? now);

  return (
    <GlamCard
      eyebrow={`Sopa de letras · ${theme.label}`}
      title={finishedAt ? "¡Completado!" : formatElapsed(elapsedMs)}
    >
      {finishedAt && startedAt ? (
        <div className="wordsearch-win">
          <p className="wordsearch-win-message">
            <PartyPopper size={20} aria-hidden="true" /> Las encontraste todas
          </p>
          <p className="wordsearch-win-time">Tiempo: {formatElapsed(finishedAt - startedAt)}</p>
          <div className="wordsearch-actions">
            <Button onClick={() => startGame(theme)}>Jugar otra vez</Button>
            <Button variant="ghost" onClick={() => setTheme(null)}>
              Cambiar tema
            </Button>
          </div>
        </div>
      ) : (
        <>
          <WordSearchBoard grid={puzzle.grid} foundCells={foundCells} onSelectionEnd={handleSelectionEnd} />

          <ul className="wordsearch-word-list">
            {puzzle.words.map((word) => (
              <li key={word} data-found={foundWords.has(word)}>
                {word}
              </li>
            ))}
          </ul>

          <div className="wordsearch-actions">
            <Button variant="ghost" onClick={() => setTheme(null)}>
              Cambiar tema
            </Button>
          </div>
        </>
      )}
    </GlamCard>
  );
}
