import "./OptionPicker.css";

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  /** Color de muestra opcional (para tono de piel / color de pelo). */
  swatch?: string;
}

interface OptionPickerProps<T extends string> {
  legend: string;
  options: readonly PickerOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

/** Fila de chips seleccionables. Usado por el editor de avatar para cada categoria. */
export function OptionPicker<T extends string>({
  legend,
  options,
  selected,
  onSelect,
}: OptionPickerProps<T>): React.JSX.Element {
  return (
    <fieldset className="option-picker">
      <legend>{legend}</legend>
      <div className="option-picker-row">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="option-chip"
            data-selected={option.value === selected}
            aria-pressed={option.value === selected}
            onClick={() => onSelect(option.value)}
          >
            {option.swatch && (
              <span className="option-swatch" style={{ background: option.swatch }} />
            )}
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
