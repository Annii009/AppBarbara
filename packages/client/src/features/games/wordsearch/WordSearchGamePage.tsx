import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { mapApi } from "../../map/map-api.ts";
import { WordSearchBoard } from "./WordSearchBoard.tsx";
import "./WordSearchGamePage.css";

/**
 * Sopa de letras, en dos modos: practica libre (picker de tema) o modo mapa
 * (?node=<id>&theme=<id>, llega ya con el tema fijado). Ver la nota
 * equivalente y mas detallada en SudokuGamePage.tsx: aplica igual aqui.
 */

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
  const [searchParams] = useSearchParams();

  const nodeId = searchParams.get("node");
  const nodeThemeId = searchParams.get("theme");
  const isNodeMode = nodeId !== null;

  const [theme, setTheme] = useState<WordSearchTheme | null>(null);
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null);
  const [foundWords, setFoundWords] = useState<ReadonlySet<string>>(new Set());
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [nodeReported, setNodeReported] = useState(false);

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
    setNodeReported(false);
  }

  useEffect(() => {
    if (isNodeMode && !puzzle) {
      const match = WORD_SEARCH_THEMES.find((t) => t.id === nodeThemeId) ?? WORD_SEARCH_THEMES[0];
      if (match) startGame(match);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNodeMode]);

  useEffect(() => {
    if (finishedAt && nodeId && !nodeReported) {
      setNodeReported(true);
      mapApi.completeNode(nodeId).catch((error: unknown) => {
        console.error("[map] no se pudo guardar el progreso de este nivel:", error);
      });
    }
  }, [finishedAt, nodeId, nodeReported]);

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

  if (!isNodeMode && (!theme || !puzzle)) {
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

  if (!theme || !puzzle) {
    return <GlamCard eyebrow="Sopa de letras" title="Preparando…" />;
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
            {isNodeMode ? (
              <>
                <Button onClick={() => navigate("/map")}>Volver al mapa</Button>
                <Button variant="ghost" onClick={() => startGame(theme)}>
                  Jugar otra vez
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => startGame(theme)}>Jugar otra vez</Button>
                <Button variant="ghost" onClick={() => setTheme(null)}>
                  Cambiar tema
                </Button>
              </>
            )}
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
            <Button
              variant="ghost"
              onClick={() => (isNodeMode ? navigate("/map") : setTheme(null))}
            >
              {isNodeMode ? "Volver al mapa" : "Cambiar tema"}
            </Button>
          </div>
        </>
      )}
    </GlamCard>
  );
}
