import type { LetterStatus } from "@minibarbara/games";
import "./WordGuessBoard.css";

export interface EvaluatedGuess {
  word: string;
  statuses: LetterStatus[];
}

interface WordGuessBoardProps {
  guesses: EvaluatedGuess[];
  maxAttempts: number;
  wordLength: number;
}

/** Tablero de filas de fichas, al estilo del juego clasico de adivinar
 *  palabras: una fila por intento ya jugado, coloreada letra a letra, mas
 *  filas vacias hasta agotar los intentos disponibles. */
export function WordGuessBoard({ guesses, maxAttempts, wordLength }: WordGuessBoardProps): React.JSX.Element {
  const emptyRows = Math.max(0, maxAttempts - guesses.length);

  return (
    <div className="wordguess-board">
      {guesses.map((guess, rowIndex) => (
        <div key={rowIndex} className="wordguess-row">
          {guess.word.split("").map((letter, colIndex) => (
            <span
              key={colIndex}
              className="wordguess-tile"
              data-status={guess.statuses[colIndex]}
            >
              {letter}
            </span>
          ))}
        </div>
      ))}

      {Array.from({ length: emptyRows }, (_, rowIndex) => (
        <div key={`empty-${rowIndex}`} className="wordguess-row">
          {Array.from({ length: wordLength }, (_, colIndex) => (
            <span key={colIndex} className="wordguess-tile" data-status="empty" />
          ))}
        </div>
      ))}
    </div>
  );
}
