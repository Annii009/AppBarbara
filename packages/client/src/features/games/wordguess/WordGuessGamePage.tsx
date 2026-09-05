import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { PartyPopper } from "lucide-react";
import {
  evaluateGuess,
  isKnownWord,
  isWinningGuess,
  MAX_ATTEMPTS,
  pickSecretWord,
  WORD_LENGTH,
} from "@minibarbara/games";
import { GlamCard } from "../../../components/GlamCard.tsx";
import { Button } from "../../../components/Button.tsx";
import { TextField } from "../../../components/TextField.tsx";
import { WordGuessBoard, type EvaluatedGuess } from "./WordGuessBoard.tsx";
import "./WordGuessGamePage.css";

/** Adivina la palabra en practica libre: se puede repetir sin limite. Ver
 *  la nota de alcance equivalente en SudokuGamePage.tsx. */
export function WordGuessGamePage(): React.JSX.Element {
  const navigate = useNavigate();

  const [secret, setSecret] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<EvaluatedGuess[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const won = guesses.some((g) => secret !== null && isWinningGuess(secret, g.word));
  const outOfAttempts = !won && guesses.length >= MAX_ATTEMPTS;
  const finished = won || outOfAttempts;

  function startGame(): void {
    setSecret(pickSecretWord(crypto.randomUUID()));
    setGuesses([]);
    setDraft("");
    setError(null);
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!secret || finished) return;

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
    setGuesses((prev) => [...prev, { word: guess, statuses: evaluateGuess(secret, guess) }]);
    setDraft("");
  }

  if (!secret) {
    return (
      <GlamCard eyebrow="Minijuego" title="Adivina la palabra">
        <div className="wordguess-intro">
          <p className="wordguess-intro-text">
            Tienes {MAX_ATTEMPTS} intentos para adivinar una palabra de {WORD_LENGTH} letras.
            Verde: letra correcta en su sitio. Dorado: esta en la palabra pero
            en otra posicion.
          </p>
          <Button onClick={startGame}>Jugar</Button>
          <Button variant="ghost" onClick={() => navigate("/")}>
            Volver
          </Button>
        </div>
      </GlamCard>
    );
  }

  return (
    <GlamCard eyebrow="Adivina la palabra" title={finished ? (won ? "¡Lo lograste!" : "Sin intentos") : `Intento ${guesses.length + 1} de ${MAX_ATTEMPTS}`}>
      <WordGuessBoard guesses={guesses} maxAttempts={MAX_ATTEMPTS} wordLength={WORD_LENGTH} />

      {finished ? (
        <div className="wordguess-win">
          <p className="wordguess-win-message">
            {won && <PartyPopper size={20} aria-hidden="true" />}
            {won ? "Muy bien" : `La palabra era ${secret}`}
          </p>
          <div className="wordguess-actions">
            <Button onClick={startGame}>Jugar otra vez</Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Volver
            </Button>
          </div>
        </div>
      ) : (
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
      )}
    </GlamCard>
  );
}
