import type { TriviaQuestion } from "@minibarbara/games";
import "./TriviaQuestionCard.css";

interface TriviaQuestionCardProps {
  question: TriviaQuestion;
  /** null mientras no se ha respondido esta pregunta todavia. */
  selected: number | null;
  onSelect: (index: number) => void;
}

export function TriviaQuestionCard({ question, selected, onSelect }: TriviaQuestionCardProps): React.JSX.Element {
  const answered = selected !== null;

  return (
    <div className="trivia-card">
      <p className="trivia-question">{question.question}</p>
      <div className="trivia-options">
        {question.options.map((option, index) => (
          <button
            key={index}
            type="button"
            className="trivia-option"
            disabled={answered}
            data-state={
              !answered
                ? "idle"
                : index === question.correctIndex
                  ? "correct"
                  : index === selected
                    ? "wrong"
                    : "idle"
            }
            onClick={() => onSelect(index)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
