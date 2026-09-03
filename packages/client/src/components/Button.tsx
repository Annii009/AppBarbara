import { forwardRef, type ButtonHTMLAttributes } from "react";
import "./Button.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", isLoading = false, disabled, children, className, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={["btn", `btn--${variant}`, className].filter(Boolean).join(" ")}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...rest}
    >
      {isLoading ? "Un momento…" : children}
    </button>
  );
});
