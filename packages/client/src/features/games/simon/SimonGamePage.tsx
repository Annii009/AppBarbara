import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  countCorrectPrefix,
  DAILY_TARGET_ROUNDS,
  generateSimonSequence,
  type SimonButton,
} from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { mapApi } from "../../map/map-api.ts";
import { SimonBoard } from "./SimonBoard.tsx";
import "./SimonGamePage.css";

const SHOW_STEP_MS = 550;
const SHOW_GAP_MS = 250;
const NEXT_ROUND_DELAY_MS = 700;

type Phase = "idle" | "showing" | "input" | "gameover" | "complete";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Secuencia (al estilo Simon): repetir una secuencia de colores que crece
 * una posicion cada ronda, desde el principio cada vez. Practica libre y
 * modo mapa como el resto de juegos (ver la nota en SudokuGamePage.tsx).
 */
export function SimonGamePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nodeId = searchParams.get("node");
  const isNodeMode = nodeId !== null;

  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState<SimonButton[]>([]);
  const [round, setRound] = useState(1);
  const [roundsCompleted, setRoundsCompleted] = useState(0);
  const [playerInput, setPlayerInput] = useState<SimonButton[]>([]);
  const [activeButton, setActiveButton] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [nodeReported, setNodeReported] = useState(false);
  const timeouts = useRef<number[]>([]);

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  useEffect(() => {
    return () => {
      timeouts.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  function schedule(fn: () => void, delay: number): void {
    const id = window.setTimeout(fn, delay);
    timeouts.current.push(id);
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

  function startGame(): void {
    const seed = crypto.randomUUID();
    const sequence = generateSimonSequence(seed, DAILY_TARGET_ROUNDS);
    setTarget(sequence);
    setRound(1);
    setRoundsCompleted(0);
    setFinishedAt(null);
    setStartedAt(Date.now());
    setNow(Date.now());
    setNodeReported(false);
    playSequence(sequence.slice(0, 1));
  }

  useEffect(() => {
    if (isNodeMode && phase === "idle") startGame();
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

  function handlePress(button: SimonButton): void {
    if (phase !== "input") return;

    const nextInput = [...playerInput, button];
    setPlayerInput(nextInput);
    setActiveButton(button);
    window.setTimeout(() => setActiveButton(null), 200);

    if (countCorrectPrefix(target, nextInput) !== nextInput.length) {
      setPhase("gameover");
      setFinishedAt(Date.now());
      return;
    }

    if (nextInput.length < round) return;

    setRoundsCompleted(round);
    if (round >= target.length) {
      setPhase("complete");
      setFinishedAt(Date.now());
      return;
    }

    const nextRound = round + 1;
    setPhase("showing");
    schedule(() => {
      setRound(nextRound);
      playSequence(target.slice(0, nextRound));
    }, NEXT_ROUND_DELAY_MS);
  }

  if (!isNodeMode && phase === "idle") {
    return (
      <GlamCard eyebrow="Minijuego" title="Secuencia">
        <div className="simon-intro">
          <p className="simon-intro-text">
            Repite la secuencia de colores, que crece una posicion cada ronda.
            ¿Hasta donde llegas?
          </p>
          <Button onClick={startGame}>Jugar</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  if (phase === "idle") {
    return <GlamCard eyebrow="Secuencia" title="Preparando…" />;
  }

  const elapsedMs = (finishedAt ?? now) - (startedAt ?? now);
  const won = phase === "complete";
  const finished = phase === "gameover" || phase === "complete";

  return (
    <GlamCard eyebrow={`Secuencia · ronda ${round}`} title={formatElapsed(elapsedMs)}>
      {finished ? (
        <div className="simon-win">
          <p className="simon-win-message">
            {won && <PartyPopper size={20} aria-hidden="true" />}
            {won ? "¡Las 10 rondas!" : `Llegaste a la ronda ${roundsCompleted}`}
          </p>
          <div className="simon-actions">
            {isNodeMode ? (
              <>
                <Button onClick={() => navigate("/map")}>Volver al mapa</Button>
                <Button variant="ghost" onClick={startGame}>
                  Jugar otra vez
                </Button>
              </>
            ) : (
              <>
                <Button onClick={startGame}>Jugar otra vez</Button>
                <Button variant="ghost" onClick={() => navigate("/")}>
                  Volver
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <p className="simon-status">{phase === "showing" ? "Mira bien…" : "Tu turno"}</p>
          <SimonBoard activeButton={activeButton} disabled={phase !== "input"} onPress={handlePress} />
        </>
      )}
    </GlamCard>
  );
}
