import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import { DAILY_PASS_THRESHOLD, pickDailyQuestions, scoreAnswers, type TriviaQuestion } from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { TriviaQuestionCard } from "./TriviaQuestionCard.tsx";
import "./TriviaGamePage.css";

/** Trivia rosa en practica libre: se puede repetir sin limite, sin umbral
 *  que superar (eso solo importa en el reto diario). Ver la nota de alcance
 *  equivalente en SudokuGamePage.tsx. */
export function TriviaGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<TriviaQuestion[] | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  function startGame(): void {
    const next = pickDailyQuestions(crypto.randomUUID());
    setQuestions(next);
    setAnswers(next.map(() => null));
    setCurrentIndex(0);
  }

  function handleSelect(index: number): void {
    setAnswers((prev) => prev.map((value, i) => (i === currentIndex ? index : value)));
  }

  if (!questions) {
    return (
      <GlamCard eyebrow="Minijuego" title="Trivia rosa" maxWidth="26rem">
        <div className="trivia-intro">
          <p className="trivia-intro-text">Cultura general, moda y un poco de todo. ¿Cuanto sabes?</p>
          <Button onClick={startGame}>Jugar</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  const finished = currentIndex >= questions.length;

  if (finished) {
    const score = scoreAnswers(questions, answers.map((a) => a ?? -1));
    const passed = score >= DAILY_PASS_THRESHOLD;
    return (
      <GlamCard eyebrow="Trivia rosa" title={`${score} de ${questions.length}`} maxWidth="26rem">
        <div className="trivia-win">
          <p className="trivia-win-message">
            {passed && <PartyPopper size={20} aria-hidden="true" />}
            {passed ? "¡Muy bien!" : "Sigue practicando"}
          </p>
          <div className="trivia-actions">
            <Button onClick={startGame}>Jugar otra vez</Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Volver
            </Button>
          </div>
        </div>
      </GlamCard>
    );
  }

  const question = questions[currentIndex] as TriviaQuestion;
  const selected = answers[currentIndex] ?? null;

  return (
    <GlamCard eyebrow="Trivia rosa" title={`Pregunta ${currentIndex + 1} de ${questions.length}`} maxWidth="26rem">
      <TriviaQuestionCard question={question} selected={selected} onSelect={handleSelect} />
      {selected !== null && (
        <div className="trivia-actions">
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>
            {currentIndex + 1 === questions.length ? "Ver resultado" : "Siguiente"}
          </Button>
        </div>
      )}
    </GlamCard>
  );
}
