import "./SimonBoard.css";

const BUTTON_COLORS = ["var(--c-pink-400)", "var(--c-sky)", "var(--c-mint)", "var(--c-gold-400)"] as const;

interface SimonBoardProps {
  /** El boton "iluminado" ahora mismo, ya sea porque se esta reproduciendo
   *  la secuencia o porque la jugadora acaba de pulsarlo. `null` = ninguno. */
  activeButton: number | null;
  disabled: boolean;
  onPress: (button: 0 | 1 | 2 | 3) => void;
}

export function SimonBoard({ activeButton, disabled, onPress }: SimonBoardProps): React.JSX.Element {
  return (
    <div className="simon-board" role="group" aria-label="Botones de la secuencia">
      {BUTTON_COLORS.map((color, index) => (
        <button
          key={index}
          type="button"
          className="simon-button"
          data-active={activeButton === index}
          style={{ "--btn-color": color } as React.CSSProperties}
          disabled={disabled}
          onClick={() => onPress(index as 0 | 1 | 2 | 3)}
          aria-label={`Boton ${index + 1}`}
        />
      ))}
    </div>
  );
}
