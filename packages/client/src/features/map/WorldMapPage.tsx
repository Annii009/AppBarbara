import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Grid2x2,
  Grid3x3,
  LayoutGrid,
  LogOut,
  Lock,
  Repeat,
  Sparkles,
  TextSearch,
  Users,
} from "lucide-react";
import { isNodeUnlocked, WORLD_NODES, type WorldNode } from "@minibarbara/shared";
import { AvatarRenderer } from "../avatar/AvatarRenderer.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import { DailyReminderBanner } from "../daily/DailyReminderBanner.tsx";
import { mapApi } from "./map-api.ts";
import "./WorldMapPage.css";

const GAME_ICONS: Record<WorldNode["gameId"], typeof Grid3x3> = {
  sudoku: Grid3x3,
  wordsearch: TextSearch,
  memory: Grid2x2,
  "2048": LayoutGrid,
  simon: Repeat,
};

/**
 * Pantalla de inicio tras el login: el "camino" de Barbara, cada parada una
 * partida con dificultad/tema ya fijados (a diferencia de la practica
 * libre). El progreso se guarda en el servidor (packages/server/src/modules/progress)
 * y determina que paradas estan desbloqueadas.
 */
export function WorldMapPage(): React.JSX.Element | null {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [completedNodeIds, setCompletedNodeIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    mapApi
      .getProgress()
      .then((progress) => setCompletedNodeIds(new Set(progress.completedNodeIds)))
      .catch(() => setCompletedNodeIds(new Set()));
  }, []);

  if (!profile) return null;

  function openNode(node: WorldNode): void {
    const params = new URLSearchParams({ node: node.id });
    if (node.config.difficulty) params.set("difficulty", node.config.difficulty);
    if (node.config.themeId) params.set("theme", node.config.themeId);
    navigate(`/games/${node.gameId}?${params.toString()}`);
  }

  return (
    <div className="map-page">
      <header className="map-topbar">
        <button type="button" className="map-profile" onClick={() => navigate("/avatar")}>
          <AvatarRenderer avatar={profile.avatar} size={44} />
          <span className="map-profile-text">
            <span className="map-profile-greeting">Hola</span>
            <span className="map-profile-nick">{profile.user.nick}</span>
          </span>
        </button>
        <div className="map-topbar-actions">
          <button type="button" className="map-icon-btn" onClick={() => navigate("/friends")} aria-label="Amigas">
            <Users size={20} aria-hidden="true" />
          </button>
          <button type="button" className="map-daily-btn" onClick={() => navigate("/daily")}>
            <Sparkles size={16} aria-hidden="true" /> Reto diario
          </button>
        </div>
      </header>

      <DailyReminderBanner />

      <h1 className="map-title">El camino de Barbara</h1>
      <p className="map-subtitle">Completa cada parada para desbloquear la siguiente.</p>

      <div className="map-trail">
        {/* Decoracion de fondo: colinas, arbustos y nubes, puramente ambiental. */}
        <svg className="map-scenery" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="10" cy="6" r="7" className="map-scenery-bush" />
          <circle cx="92" cy="14" r="5" className="map-scenery-cloud" />
          <circle cx="6" cy="34" r="6" className="map-scenery-cloud" />
          <circle cx="94" cy="46" r="7" className="map-scenery-bush" />
          <circle cx="8" cy="62" r="5" className="map-scenery-cloud" />
          <circle cx="90" cy="78" r="6" className="map-scenery-bush" />
          <circle cx="12" cy="92" r="6" className="map-scenery-cloud" />
        </svg>

        <svg className="map-trail-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="map-trail-road"
            d="M50 0 C 18 8, 18 17, 50 25 C 82 33, 82 42, 50 50 C 18 58, 18 67, 50 75 C 82 83, 82 92, 50 100"
          />
          <path
            className="map-trail-road-center"
            d="M50 0 C 18 8, 18 17, 50 25 C 82 33, 82 42, 50 50 C 18 58, 18 67, 50 75 C 82 83, 82 92, 50 100"
          />
        </svg>

        <ol className="map-stops">
          {WORLD_NODES.map((node, index) => {
            const isDone = completedNodeIds.has(node.id);
            const unlocked = isDone || isNodeUnlocked(node, completedNodeIds);
            const align = index % 2 === 0 ? "left" : "right";
            const GameIcon = GAME_ICONS[node.gameId];

            return (
              <li key={node.id} className="map-stop" data-align={align}>
                <button
                  type="button"
                  className="map-pin"
                  data-state={isDone ? "done" : unlocked ? "open" : "locked"}
                  disabled={!unlocked}
                  onClick={() => openNode(node)}
                  aria-label={node.title}
                >
                  <span className="map-pin-number">{index + 1}</span>
                  {unlocked ? (
                    <GameIcon size={22} aria-hidden="true" />
                  ) : (
                    <Lock size={20} aria-hidden="true" />
                  )}
                  {isDone && (
                    <span className="map-pin-check">
                      <CheckCircle2 size={16} aria-hidden="true" />
                    </span>
                  )}
                </button>
                <div className="map-stop-label">
                  <span className="map-stop-title">{node.title}</span>
                  <span className="map-stop-flavor">{node.flavorText}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="map-freeplay">
        <p className="map-freeplay-title">Práctica libre</p>
        <div className="map-freeplay-buttons">
          <button type="button" onClick={() => navigate("/games/sudoku")}>
            <Grid3x3 size={16} aria-hidden="true" /> Sudoku
          </button>
          <button type="button" onClick={() => navigate("/games/wordsearch")}>
            <TextSearch size={16} aria-hidden="true" /> Sopa de letras
          </button>
          <button type="button" onClick={() => navigate("/games/memory")}>
            <Grid2x2 size={16} aria-hidden="true" /> Memorama
          </button>
          <button type="button" onClick={() => navigate("/games/2048")}>
            <LayoutGrid size={16} aria-hidden="true" /> 2048
          </button>
          <button type="button" onClick={() => navigate("/games/simon")}>
            <Repeat size={16} aria-hidden="true" /> Secuencia
          </button>
        </div>
      </div>

      <button type="button" className="map-logout" onClick={() => void logout()}>
        <LogOut size={14} aria-hidden="true" /> Cerrar sesión
      </button>
    </div>
  );
}
