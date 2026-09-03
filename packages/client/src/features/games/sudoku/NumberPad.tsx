import "./NumberPad.css";

interface NumberPadProps {
  onPick: (value: number) => void;
  onErase: () => void;
  disabled?: boolean;
  /** Numeros que ya tienen sus 9 apariciones colocadas: se apagan para no
   *  liar a la jugadora con un numero que ya no tiene sentido pulsar. */
  exhaustedValues?: ReadonlySet<number>;
}

const VALUES = Array.from({ length: 9 }, (_, i) => i + 1);

export function NumberPad({
  onPick,
  onErase,
  disabled = false,
  exhaustedValues,
}: NumberPadProps): React.JSX.Element {
  return (
    <div className="number-pad">
      {VALUES.map((value) => (
        <button
          key={value}
          type="button"
          className="number-pad-key"
          disabled={disabled || exhaustedValues?.has(value)}
          onClick={() => onPick(value)}
        >
          {value}
        </button>
      ))}
      <button
        type="button"
        className="number-pad-key number-pad-erase"
        disabled={disabled}
        onClick={onErase}
      >
        Borrar
      </button>
    </div>
  );
}
