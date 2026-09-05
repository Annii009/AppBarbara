import { useMemo, useState, type FormEvent } from "react";
import {
  evaluateGuess,
  isKnownWord,
  isWinningGuess,
  MAX_ATTEMPTS,
  pickSecretWord,
  WORD_LENGTH,
} from "@minibarbara/games";
import { dailySeed, type CompleteDailyRequest } from "@minibarbara/shared";
import { Button } from "../../../components/Button.tsx";
import { TextField } from "../../../components/TextField.tsx";
import { WordGuessBoard, type EvaluatedGuess } from "../../games/wordguess/WordGuessBoard.tsx";
import "../../games/wordguess/WordGuessGamePage.css";
import "../DailyChallengePage.css";

interface DailyWordGuessPlayProps {
  gameDay: string;
  onComplete: (payload: Omit<CompleteDailyRequest, "elapsedMs" | "gameId">) => void;
}

export function DailyWordGuessPlay({ gameDay, onComplete }: DailyWordGuessPlayProps): React.JSX.Element {
  const secret = useMemo(() => pickSecretWord(dailySeed("wordguess", gameDay)), [gameDay]);
  const [guesses, setGuesses] = useState<EvaluatedGuess[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const outOfAttempts = guesses.length >= MAX_ATTEMPTS;

  function restart(): void {
    setGuesses([]);
    setDraft("");
    setError(null);
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (outOfAttempts) return;

    const guess = draft.trim().toUpperCase();
    if (guess.length !== WORD_LENGTH) {
      setError(`La palabra tiene que tener ${WORD_LENGTH} letras.`);
      return;
    }
    if (!isKnownWord(guess)) {
      setError("Esa palabra no esta en el diccionario del juego.");
      return;
    }

    setError(null);
    const nextGuesses = [...guesses, { word: guess, statuses: evaluateGuess(secret, guess) }];
    setGuesses(nextGuesses);
    setDraft("");

    if (isWinningGuess(secret, guess)) {
      onComplete({ guesses: nextGuesses.map((g) => g.word) });
    }
  }

  if (outOfAttempts) {
    return (
      <div className="daily-play-stuck">
        <p className="daily-play-subtitle">Sin intentos. La palabra era {secret}.</p>
        <Button variant="ghost" onClick={restart}>
          Intentarlo de nuevo
        </Button>
      </div>
    );
  }

  return (
    <>
      <p className="daily-play-subtitle">
        Intento {guesses.length + 1} de {MAX_ATTEMPTS}
      </p>
      <WordGuessBoard guesses={guesses} maxAttempts={MAX_ATTEMPTS} wordLength={WORD_LENGTH} />
      <form className="wordguess-form" onSubmit={handleSubmit}>
        <TextField
          label="Tu intento"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={WORD_LENGTH}
          autoComplete="off"
          autoCapitalize="characters"
          error={error ?? undefined}
        />
        <Button type="submit">Probar</Button>
      </form>
    </>
  );
}
