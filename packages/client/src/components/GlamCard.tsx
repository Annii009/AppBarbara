import type { ReactNode } from "react";
import "./GlamCard.css";

interface GlamCardProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: string;
  /** Ancho maximo de la tarjeta (p.ej. "34rem"). Por defecto el ancho
   *  compacto de las pantallas "de una sola cosa" (login, avatar...); las
   *  pantallas con mas contenido, como un minijuego, pueden pedir uno mayor. */
  maxWidth?: string;
  children?: ReactNode;
}

/** Tarjeta centrada de pantalla completa: el contenedor visual de las
 *  pantallas "de una sola cosa" (login, registro, carga...). */
export function GlamCard({
  eyebrow,
  title,
  subtitle,
  maxWidth,
  children,
}: GlamCardProps): React.JSX.Element {
  return (
    <div className="glam-shell">
      <div className="glam-card" style={maxWidth ? { maxWidth } : undefined}>
        {eyebrow && <p className="glam-eyebrow">{eyebrow}</p>}
        <h1 className="glam-title">{title}</h1>
        {subtitle && <p className="glam-subtitle">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
