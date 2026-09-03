import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NICK_MAX_LENGTH, NICK_MIN_LENGTH, PASSWORD_MIN_LENGTH } from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { TextField } from "../../components/TextField.tsx";
import { Button } from "../../components/Button.tsx";
import { ApiRequestError } from "../../lib/api.ts";
import { useAuth } from "./AuthContext.tsx";
import "./AuthForm.css";

export function RegisterPage(): React.JSX.Element {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (password !== confirm) {
      setFieldErrors({ confirm: "Las contrasenas no coinciden." });
      return;
    }

    setSubmitting(true);
    try {
      await register(nick, password);
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fields ?? {});
        // Si ya hay un error de campo, no dupliques el mismo mensaje encima.
        setFormError(error.fields ? null : error.message);
      } else {
        setFormError("No se ha podido crear la cuenta. Intentalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlamCard
      eyebrow="Unete al mundo"
      title={
        <>
          mini<span className="brand">Barbara</span>
        </>
      }
    >
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <TextField
          label="Nick"
          name="nick"
          autoComplete="username"
          value={nick}
          onChange={(event) => setNick(event.target.value)}
          error={fieldErrors["nick"]}
          hint={
            fieldErrors["nick"]
              ? undefined
              : `${NICK_MIN_LENGTH}-${NICK_MAX_LENGTH} caracteres, sin espacios`
          }
          required
        />
        <TextField
          label="Contrasena"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors["password"]}
          hint={fieldErrors["password"] ? undefined : `Minimo ${PASSWORD_MIN_LENGTH} caracteres`}
          required
        />
        <TextField
          label="Repite la contrasena"
          name="confirm"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={fieldErrors["confirm"]}
          required
        />
        {formError && (
          <p className="auth-form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>
      <p className="auth-switch">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesion</Link>
      </p>
    </GlamCard>
  );
}
