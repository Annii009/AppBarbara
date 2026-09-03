import { useEffect, useRef, useState } from "react";
import {
  countCorrectPrefix,
  DAILY_TARGET_ROUNDS,
  generateSimonSequence,
  type SimonButton,
} from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { Button } from "../../../components/Button.tsx";
import { SimonBoard } from "../../games/simon/SimonBoard.tsx";
import "../DailyChallengePage.css";

const SHOW_STEP_MS = 550;
const SHOW_GAP_MS = 250;
const NEXT_ROUND_DELAY_MS = 700;

type Phase = "showing" | "input" | "gameover";

interface DailySimonPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs">) => void;
}

export function DailySimonPlay({ gameDay, onComplete }: DailySimonPlayProps): React.JSX.Element {
  const target = useRef<SimonButton[]>(generateSimonSequence(dailySeed("simon", gameDay), DAILY_TARGET_ROUNDS));
  const [phase, setPhase] = useState<Phase>("showing");
  const [round, setRound] = useState(1);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [playerInput, setPlayerInput] = useState<SimonButton[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const timeouts = useRef<number[]>([]);

  function schedule(fn: () => void, delay: number): void {
    timeouts.current.push(window.setTimeout(fn, delay));
  }

  function playSequence(sequence: readonly SimonButton[]): void {
    timeouts.current.forEach((id) => window.clearTimeout(id));
    timeouts.current = [];
    setPhase("showing");
    setPlayerInput([]);

    sequence.forEach((button, index) => {
      const start = index * (SHOW_STEP_MS + SHOW_GAP_MS);
      schedule(() => setActiveButton(button), start);
      schedule(() => setActiveButton(null), start + SHOW_STEP_MS);
    });
    schedule(() => setPhase("input"), sequence.length * (SHOW_STEP_MS + SHOW_GAP_MS));
  }

  function restart(): void {
    setRound(1);
    setRoundsCompleted(0);
    playSequence(target.current.slice(0, 1));
  }

  useEffect(() => {
    playSequence(target.current.slice(0, 1));
    return () => timeouts.current.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePress(button: SimonButton): void {
    if (phase !== "input") return;

    const nextInput = [...playerInput, button];
    setPlayerInput(nextInput);
    setActiveButton(button);
    window.setTimeout(() => setActiveButton(null), 200);

    if (countCorrectPrefix(target.current, nextInput) !== nextInput.length) {
      setPhase("gameover");
      return;
    }
    if (nextInput.length < round) return;

    setRoundsCompleted(round);
    if (round >= target.current.length) {
      onComplete({ sequence: target.current.slice(0, round) });
      return;
    }

    const nextRound = round + 1;
    setPhase("showing");
    schedule(() => {
      setRound(nextRound);
      playSequence(target.current.slice(0, nextRound));
    }, NEXT_ROUND_DELAY_MS);
  }

  if (phase === "gameover") {
    return (
      <div className="daily-play-stuck">
        <p className="daily-play-subtitle">Llegaste a la ronda {roundsCompleted}.</p>
        <Button variant="ghost" onClick={restart}>
          Intentarlo de nuevo
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="daily-play-subtitle">{phase === "showing" ? "Mira bien…" : `Ronda ${round}`}</p>
      <SimonBoard activeButton={activeButton} disabled={phase !== "input"} onPress={handlePress} />
    </>
  );
}
