import { useMemo, useRef, useState } from "react";
import {
  DAILY_PAIR_COUNT,
  generateMemoryPuzzle,
  isMatch,
  isPuzzleSolved,
  type MemoryCard,
} from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { MemoryBoard } from "../../games/memory/MemoryBoard.tsx";
import "../DailyChallengePage.css";

const MISMATCH_DELAY_MS = 900;

interface DailyMemoryPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs">) => void;
}

export function DailyMemoryPlay({ gameDay, onComplete }: DailyMemoryPlayProps): React.JSX.Element {
  const puzzle = useMemo(
    () => generateMemoryPuzzle(dailySeed("memory", gameDay), DAILY_PAIR_COUNT),
    [gameDay],
  );
  const [revealedIds, setRevealedIds] = useState<ReadonlySet<string>>(new Set());
  const [matchedIds, setMatchedIds] = useState<ReadonlySet<string>>(new Set());
  const [isChecking, setChecking] = useState(false);
  const timeout = useRef<number | null>(null);

  const totalPairs = puzzle.cards.length / 2;

  function handleCardClick(card: MemoryCard): void {
    if (isChecking || revealedIds.has(card.id) || matchedIds.has(card.id) || revealedIds.size >= 2) return;

    const nextRevealed = new Set(revealedIds);
    nextRevealed.add(card.id);
    setRevealedIds(nextRevealed);
    if (nextRevealed.size < 2) return;

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
        onComplete({ matchedPairs: nextMatched.size / 2 });
      }
    } else {
      setChecking(true);
      timeout.current = window.setTimeout(() => {
        setRevealedIds(new Set());
        setChecking(false);
      }, MISMATCH_DELAY_MS);
    }
  }

  return (
    <>
      <p className="daily-play-subtitle">
        {matchedIds.size / 2} / {totalPairs} parejas
      </p>
      <MemoryBoard
        cards={puzzle.cards}
        revealedIds={revealedIds}
        matchedIds={matchedIds}
        onCardClick={handleCardClick}
        disabled={isChecking}
      />
    </>
  );
}
