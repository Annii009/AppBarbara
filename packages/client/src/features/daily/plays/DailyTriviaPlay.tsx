import { useMemo, useState } from "react";
import { DAILY_PASS_THRESHOLD, pickDailyQuestions, scoreAnswers } from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { Button } from "../../../components/Button.tsx";
import { TriviaQuestionCard } from "../../games/trivia/TriviaQuestionCard.tsx";

interface DailyTriviaPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">) => void;
}

export function DailyTriviaPlay({ gameDay, onComplete }: DailyTriviaPlayProps): React.JSX.Element {
  const questions = useMemo(() => pickDailyQuestions(dailySeed("trivia", gameDay)), [gameDay]);
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [currentIndex, setCurrentIndex] = useState(0);

  const finished = currentIndex >= questions.length;
  const score = finished ? scoreAnswers(questions, answers.map((a) => a ?? -1)) : 0;

  function handleSelect(index: number): void {
    setAnswers((prev) => prev.map((value, i) => (i === currentIndex ? index : value)));
  }

  function restart(): void {
    setAnswers(questions.map(() => null));
    setCurrentIndex(0);
  }

  function handleNext(): void {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      return;
    }
    const finalAnswers = answers.map((a) => a ?? -1);
    if (scoreAnswers(questions, finalAnswers) >= DAILY_PASS_THRESHOLD) {
      onComplete({ answers: finalAnswers });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (finished) {
    return (
      <div className="daily-play-stuck">
        <p className="daily-play-subtitle">
          {score} de {questions.length} — necesitas al menos {DAILY_PASS_THRESHOLD} para completar el reto.
        </p>
        <Button variant="ghost" onClick={restart}>
          Intentarlo de nuevo
        </Button>
      </div>
    );
  }

  const question = questions[currentIndex]!;
  const selected = answers[currentIndex] ?? null;

  return (
    <>
      <p className="daily-play-subtitle">
        Pregunta {currentIndex + 1} de {questions.length}
      </p>
      <TriviaQuestionCard question={question} selected={selected} onSelect={handleSelect} />
      {selected !== null && (
        <Button onClick={handleNext}>
          {currentIndex + 1 === questions.length ? "Ver resultado" : "Siguiente"}
        </Button>
      )}
    </>
  );
}
