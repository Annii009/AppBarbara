import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  countCorrectPlacements,
  findConflicts,
  generateSudokuPuzzle,
  isGridComplete,
  isSolutionCorrect,
  type SudokuGrid,
  type SudokuPuzzle,
} from "@minibarbara/games";
import { DIFFICULTIES, type Difficulty } from "@minibarbara/shared";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { mapApi } from "../../map/map-api.ts";
import { NumberPad } from "./NumberPad.tsx";
import { SudokuBoard } from "./SudokuBoard.tsx";
import "./SudokuGamePage.css";

/**
 * Sudoku, en dos modos:
 *  - Practica libre (sin parametros en la URL): picker de dificultad, se
 *    puede repetir sin limite.
 *  - Modo mapa (?node=<id>&difficulty=<d>): llega desde una parada del mapa
 *    con la dificultad ya fijada; al resolverlo avisa al servidor para
 *    desbloquear la siguiente parada (packages/server/src/modules/progress).
 *
 * En ambos casos se genera y valida en el navegador (ver la nota de alcance
 * mas abajo): la unica partida que el servidor valida de verdad es el reto
 * diario (features/daily), porque es la unica con algo que proteger
 * (racha). Aqui no hay nada que "hacer trampa" ganaria.
 */

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Facil",
  medium: "Media",
  hard: "Dificil",
};

interface Selected {
  row: number;
  col: number;
}

function cellKey(row: number, col: number): string {
  return `${row}-${col}`;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function isDifficulty(value: string | null): value is Difficulty {
  return value !== null && (DIFFICULTIES as readonly string[]).includes(value);
}

export function SudokuGamePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const nodeId = searchParams.get("node");
  const nodeDifficulty = searchParams.get("difficulty");
  const isNodeMode = nodeId !== null;

  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [game, setGame] = useState<SudokuPuzzle | null>(null);
  const [draft, setDraft] = useState<SudokuGrid | null>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [nodeReported, setNodeReported] = useState(false);

  useEffect(() => {
    if (!startedAt || finishedAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, finishedAt]);

  function startGame(nextDifficulty: Difficulty): void {
    const seed = crypto.randomUUID();
    const puzzle = generateSudokuPuzzle(seed, nextDifficulty);

    setDifficulty(nextDifficulty);
    setGame(puzzle);
    setDraft(puzzle.puzzle.map((row) => [...row]));
    setSelected(null);
    setFinishedAt(null);
    setStartedAt(Date.now());
    setNow(Date.now());
    setNodeReported(false);
  }

  // En modo mapa, arranca sola con la dificultad que trae la URL: no hay picker que mostrar.
  useEffect(() => {
    if (isNodeMode && !game) {
      startGame(isDifficulty(nodeDifficulty) ? nodeDifficulty : "medium");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNodeMode]);

  // Avisa al servidor de que este nodo del mapa esta completado, una sola vez.
  useEffect(() => {
    if (finishedAt && nodeId && !nodeReported) {
      setNodeReported(true);
      mapApi.completeNode(nodeId).catch((error: unknown) => {
        console.error("[map] no se pudo guardar el progreso de este nivel:", error);
      });
    }
  }, [finishedAt, nodeId, nodeReported]);

  function setCellValue(value: number): void {
    if (!draft || !game || !selected || finishedAt) return;

    const next = draft.map((row) => [...row]);
    const row = next[selected.row];
    if (!row) return;
    row[selected.col] = value;
    setDraft(next);

    if (isGridComplete(next) && isSolutionCorrect(next, game.solution)) {
      setFinishedAt(Date.now());
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (!selected) return;
    if (event.key >= "1" && event.key <= "9") {
      setCellValue(Number(event.key));
    } else if (event.key === "Backspace" || event.key === "Delete" || event.key === "0") {
      setCellValue(0);
    }
  }

  const conflictKeys = useMemo(() => {
    if (!draft) return new Set<string>();
    return new Set(findConflicts(draft).map((c) => cellKey(c.row, c.col)));
  }, [draft]);

  const exhaustedValues = useMemo(() => {
    const exhausted = new Set<number>();
    if (!draft || !game) return exhausted;
    for (let value = 1; value <= 9; value++) {
      if (countCorrectPlacements(draft, game.solution, value) >= 9) exhausted.add(value);
    }
    return exhausted;
  }, [draft, game]);

  if (!isNodeMode && (!difficulty || !game || !draft)) {
    return (
      <GlamCard eyebrow="Minijuego" title="Sudoku">
        <div className="sudoku-difficulty-picker">
          <p className="sudoku-intro">Elige dificultad para empezar una partida.</p>
          {DIFFICULTIES.map((level) => (
            <Button key={level} onClick={() => startGame(level as Difficulty)}>
              {DIFFICULTY_LABELS[level as Difficulty]}
            </Button>
          ))}
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  if (!difficulty || !game || !draft) {
    // Modo mapa: el useEffect de arriba esta arrancando la partida.
    return <GlamCard eyebrow="Sudoku" title="Preparando…" />;
  }

  const elapsedMs = (finishedAt ?? now) - (startedAt ?? now);

  return (
    <GlamCard
      eyebrow={`Sudoku · ${DIFFICULTY_LABELS[difficulty]}`}
      title={finishedAt ? "¡Resuelto!" : formatElapsed(elapsedMs)}
    >
      {finishedAt && startedAt ? (
        <div className="sudoku-win">
          <p className="sudoku-win-message">
            <PartyPopper size={22} aria-hidden="true" /> Muy bien
          </p>
          <p className="sudoku-win-time">Tiempo: {formatElapsed(finishedAt - startedAt)}</p>
          <div className="sudoku-actions">
            {isNodeMode ? (
              <>
                <Button onClick={() => navigate("/map")}>Volver al mapa</Button>
                <Button variant="ghost" onClick={() => startGame(difficulty)}>
                  Jugar otra vez
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => startGame(difficulty)}>Jugar otra vez</Button>
                <Button variant="ghost" onClick={() => setDifficulty(null)}>
                  Cambiar dificultad
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="sudoku-board-wrapper" onKeyDown={handleKeyDown}>
            <SudokuBoard
              puzzle={game.puzzle}
              draft={draft}
              solution={game.solution}
              conflicts={conflictKeys}
              selected={selected}
              onSelect={(row, col) => setSelected({ row, col })}
            />
          </div>
          <NumberPad
            onPick={(value) => setCellValue(value)}
            onErase={() => setCellValue(0)}
            disabled={!selected}
            exhaustedValues={exhaustedValues}
          />
          <div className="sudoku-actions">
            <Button
              variant="ghost"
              onClick={() => (isNodeMode ? navigate("/map") : setDifficulty(null))}
            >
              {isNodeMode ? "Volver al mapa" : "Cambiar dificultad"}
            </Button>
          </div>
        </>
      )}
    </GlamCard>
  );
}
