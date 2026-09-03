import { useId, type InputHTMLAttributes } from "react";
import "./TextField.css";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  hint?: string | undefined;
}

export function TextField({
  label,
  error,
  hint,
  id,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className={error ? "has-error" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? hintId : undefined}
        {...rest}
      />
      {(error ?? hint) && (
        <p id={hintId} className={error ? "field-error" : "field-hint"}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
