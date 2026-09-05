import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  generateMemoryPuzzle,
  isMatch,
  isPuzzleSolved,
  type MemoryCard,
  type MemoryPuzzle,
} from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { MemoryBoard } from "./MemoryBoard.tsx";
import "./MemoryGamePage.css";

/** Memorama en practica libre: picker de dificultad, se puede repetir sin
 *  limite. Ver la nota de alcance equivalente en SudokuGamePage.tsx. */

type MemoryDifficulty = "easy" | "medium" | "hard";

const PAIR_COUNTS: Record<MemoryDifficulty, number> = {
  easy: 6,
  medium: 8,
  hard: 10,
};

const DIFFICULTY_LABELS: Record<MemoryDifficulty, string> = {
  easy: "Facil",
  medium: "Media",
  hard: "Dificil",
};

const MISMATCH_DELAY_MS = 900;

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MemoryGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [difficulty, setDifficulty] = useState<MemoryDifficulty | null>(null);
  const [puzzle, setPuzzle] = useState<MemoryPuzzle | null>(null);
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(new Set());
  const [matchedIds, setMatchedIds] = useState<ReadonlySet<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [isChecking, setChecking] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const checkTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  useEffect(() => {
    return () => {
      if (checkTimeout.current) window.clearTimeout(checkTimeout.current);
    };
  }, []);

  function startGame(nextDifficulty: MemoryDifficulty): void {
    const seed = crypto.randomUUID();
    setDifficulty(nextDifficulty);
    setPuzzle(generateMemoryPuzzle(seed, PAIR_COUNTS[nextDifficulty]));
    setRevealedIds(new Set());
    setMatchedIds(new Set());
    setMoves(0);
    setChecking(false);
    setFinishedAt(null);
    setStartedAt(Date.now());
    setNow(Date.now());
  }

  const matchedCount = useMemo(() => matchedIds.size / 2, [matchedIds]);
  const totalPairs = puzzle ? puzzle.cards.length / 2 : 0;

  function handleCardClick(card: MemoryCard): void {
    if (!puzzle || isChecking || finishedAt) return;
    if (revealedIds.has(card.id) || matchedIds.has(card.id) || revealedIds.size >= 2) return;

    const nextRevealed = new Set(revealedIds);
    nextRevealed.add(card.id);
    setRevealedIds(nextRevealed);

    if (nextRevealed.size < 2) return;

    setMoves((m) => m + 1);
    const [firstId, secondId] = [...nextRevealed];
    const first = puzzle.cards.find((c) => c.id === firstId);
    const second = puzzle.cards.find((c) => c.id === secondId);
    if (!first || !second) return;

    if (isMatch(first, second)) {
      const nextMatched = new Set(matchedIds);
      nextMatched.add(first.id);
      nextMatched.add(second.id);
      setMatchedIds(nextMatched);
      setRevealedIds(new Set());

      if (isPuzzleSolved(puzzle.cards, nextMatched)) {
        setFinishedAt(Date.now());
      }
    } else {
      setChecking(true);
      checkTimeout.current = window.setTimeout(() => {
        setRevealedIds(new Set());
        setChecking(false);
      }, MISMATCH_DELAY_MS);
    }
  }

  if (!difficulty || !puzzle) {
    return (
      <GlamCard eyebrow="Minijuego" title="Memorama">
        <div className="memory-difficulty-picker">
          <p className="memory-intro">Elige cuantas parejas quieres buscar.</p>
          {(Object.keys(PAIR_COUNTS) as MemoryDifficulty[]).map((level) => (
            <Button key={level} onClick={() => startGame(level)}>
              {DIFFICULTY_LABELS[level]} · {PAIR_COUNTS[level]} parejas
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
    <GlamCard eyebrow={`Memorama · ${DIFFICULTY_LABELS[difficulty]}`} title={formatElapsed(elapsedMs)}>
      {finishedAt && startedAt ? (
        <div className="memory-win">
          <p className="memory-win-message">
            <PartyPopper size={20} aria-hidden="true" /> Las encontraste todas
          </p>
          <p className="memory-win-time">
            Tiempo: {formatElapsed(finishedAt - startedAt)} · {moves} intentos
          </p>
          <div className="memory-actions">
            <Button onClick={() => startGame(difficulty)}>Jugar otra vez</Button>
            <Button variant="ghost" onClick={() => setDifficulty(null)}>
              Cambiar dificultad
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="memory-progress">
            {matchedCount} / {totalPairs} parejas · {moves} intentos
          </p>
          <MemoryBoard
            cards={puzzle.cards}
            revealedIds={revealedIds}
            matchedIds={matchedIds}
            onCardClick={handleCardClick}
            disabled={isChecking}
          />
          <div className="memory-actions">
            <Button variant="ghost" onClick={() => setDifficulty(null)}>
              Cambiar dificultad
            </Button>
          </div>
        </>
      )}
    </GlamCard>
  );
}
