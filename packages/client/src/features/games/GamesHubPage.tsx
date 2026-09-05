import { useNavigate } from "react-router-dom";
import { GAME_FREE_PLAY_ROUTES, GAME_ICONS, GAME_LABELS } from "./game-meta.ts";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import "./GamesHubPage.css";

const GAME_ORDER = Object.keys(GAME_LABELS) as (keyof typeof GAME_LABELS)[];

/** Practica libre: los 5 minijuegos, jugables sin limite a cualquier hora,
 *  separados del reto diario que hay en DailyHubPage. */
export function GamesHubPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <GlamCard eyebrow="Practica libre" title="Minijuegos" maxWidth="26rem">
      <ul className="games-hub-list">
        {GAME_ORDER.map((gameId) => {
          const Icon = GAME_ICONS[gameId];
          return (
            <li key={gameId}>
              <button
                type="button"
                className="games-hub-row"
                onClick={() => navigate(GAME_FREE_PLAY_ROUTES[gameId])}
              >
                <Icon size={20} aria-hidden="true" />
                {GAME_LABELS[gameId]}
              </button>
            </li>
          );
        })}
      </ul>

      <Button variant="ghost" onClick={() => navigate("/")}>
        Volver al inicio
      </Button>
    </GlamCard>
  );
}
