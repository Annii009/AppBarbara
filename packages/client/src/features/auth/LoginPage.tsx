import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GlamCard } from "../../components/GlamCard.tsx";
import { TextField } from "../../components/TextField.tsx";
import { Button } from "../../components/Button.tsx";
import { ApiRequestError } from "../../lib/api.ts";
import { useAuth } from "./AuthContext.tsx";
import "./AuthForm.css";

export function LoginPage(): React.JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [nick, setNick] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent): Promise<void> {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      await login(nick, password);
      navigate("/", { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        setFieldErrors(error.fields ?? {});
        setFormError(error.message);
      } else {
        setFormError("No se ha podido iniciar sesion. Intentalo de nuevo.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlamCard
      eyebrow="Bienvenida de nuevo"
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
          required
        />
        <TextField
          label="Contrasena"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors["password"]}
          required
        />
        {formError && (
          <p className="auth-form-error" role="alert">
            {formError}
          </p>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          Entrar
        </Button>
      </form>
      <p className="auth-switch">
        ¿No tienes cuenta? <Link to="/register">Creala aqui</Link>
      </p>
    </GlamCard>
  );
}
