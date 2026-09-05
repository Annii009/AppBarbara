import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Droplet,
  Gem,
  Image as ImageIcon,
  Palette,
  Scissors,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  ACCESSORIES,
  ACCESSORY_LABELS,
  BACKGROUNDS,
  BACKGROUND_LABELS,
  HAIR_COLORS,
  HAIR_COLOR_LABELS,
  HAIR_COLOR_SWATCHES,
  HAIR_STYLES,
  HAIR_STYLE_LABELS,
  MAKEUPS,
  MAKEUP_LABELS,
  OUTFITS,
  OUTFIT_LABELS,
  SKIN_TONES,
  SKIN_TONE_LABELS,
  SKIN_TONE_SWATCHES,
  type AvatarConfig,
} from "@minibarbara/shared";
import { GlamCard } from "../../components/GlamCard.tsx";
import { Button } from "../../components/Button.tsx";
import { OptionPicker } from "../../components/OptionPicker.tsx";
import { ApiRequestError } from "../../lib/api.ts";
import { useAuth } from "../auth/AuthContext.tsx";
import { AvatarRenderer } from "./AvatarRenderer.tsx";
import { avatarApi } from "./avatar-api.ts";
import "./AvatarEditorPage.css";

/** Valor sentinela para "sin accesorio" / "sin maquillaje" en los selectores,
 *  que solo trabajan con strings. Se traduce a `null` al guardar en el draft. */
const NONE = "none" as const;

type CategoryKey = "skinTone" | "hairStyle" | "hairColor" | "outfit" | "accessory" | "makeup" | "background";

interface Category {
  key: CategoryKey;
  label: string;
  icon: LucideIcon;
  tint: string;
}

/** El armario: una categoria por icono de color, al estilo de un vestidor de
 *  verdad. Tocar un icono abre solo las opciones de esa categoria debajo -
 *  mas compacto que tener las 7 listas siempre abiertas a la vez. */
const CATEGORIES: readonly Category[] = [
  { key: "skinTone", label: "Piel", icon: Droplet, tint: "var(--c-peach)" },
  { key: "hairStyle", label: "Peinado", icon: Scissors, tint: "var(--c-lilac)" },
  { key: "hairColor", label: "Color de pelo", icon: Palette, tint: "var(--c-gold-400)" },
  { key: "outfit", label: "Ropa", icon: Shirt, tint: "var(--c-pink-300)" },
  { key: "accessory", label: "Accesorios", icon: Gem, tint: "var(--c-mint)" },
  { key: "makeup", label: "Maquillaje", icon: Sparkles, tint: "var(--c-sky)" },
  { key: "background", label: "Fondo", icon: ImageIcon, tint: "var(--c-gold-200)" },
];

export function AvatarEditorPage(): React.JSX.Element | null {
  const { profile, setAvatar } = useAuth();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<AvatarConfig | null>(profile?.avatar ?? null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("outfit");
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // RequireAuth (ver app/router.tsx) garantiza que hay perfil si se llega
  // aqui; se protege igualmente porque TypeScript no puede saberlo.
  if (!draft) return null;

  function patch<K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]): void {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSave(): Promise<void> {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await avatarApi.update(draft);
      setAvatar(saved);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "No se ha podido guardar el avatar.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlamCard eyebrow="Personaliza" title="Crea tu avatar" maxWidth="24rem">
      <div className="avatar-editor">
        <AvatarRenderer avatar={draft} size={160} />

        <div className="avatar-editor-wardrobe" role="tablist" aria-label="Categorias del armario">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.key;
            return (
              <button
                key={category.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={category.label}
                className="avatar-editor-tile"
                data-active={isActive}
                style={{ "--tile-tint": category.tint } as React.CSSProperties}
                onClick={() => setActiveCategory(category.key)}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        <div className="avatar-editor-fields">
          {activeCategory === "skinTone" && (
            <OptionPicker
              legend="Tono de piel"
              options={SKIN_TONES.map((value) => ({
                value,
                label: SKIN_TONE_LABELS[value],
                swatch: SKIN_TONE_SWATCHES[value],
              }))}
              selected={draft.skinTone}
              onSelect={(value) => patch("skinTone", value)}
            />
          )}

          {activeCategory === "hairStyle" && (
            <OptionPicker
              legend="Peinado"
              options={HAIR_STYLES.map((value) => ({ value, label: HAIR_STYLE_LABELS[value] }))}
              selected={draft.hairStyle}
              onSelect={(value) => patch("hairStyle", value)}
            />
          )}

          {activeCategory === "hairColor" && (
            <OptionPicker
              legend="Color de pelo"
              options={HAIR_COLORS.map((value) => ({
                value,
                label: HAIR_COLOR_LABELS[value],
                swatch: HAIR_COLOR_SWATCHES[value],
              }))}
              selected={draft.hairColor}
              onSelect={(value) => patch("hairColor", value)}
            />
          )}

          {activeCategory === "outfit" && (
            <OptionPicker
              legend="Ropa"
              options={OUTFITS.map((value) => ({ value, label: OUTFIT_LABELS[value] }))}
              selected={draft.outfit}
              onSelect={(value) => patch("outfit", value)}
            />
          )}

          {activeCategory === "accessory" && (
            <OptionPicker
              legend="Accesorio"
              options={[
                { value: NONE, label: "Ninguno" },
                ...ACCESSORIES.map((value) => ({ value, label: ACCESSORY_LABELS[value] })),
              ]}
              selected={draft.accessory ?? NONE}
              onSelect={(value) => patch("accessory", value === NONE ? null : value)}
            />
          )}

          {activeCategory === "makeup" && (
            <OptionPicker
              legend="Maquillaje"
              options={[
                { value: NONE, label: "Ninguno" },
                ...MAKEUPS.map((value) => ({ value, label: MAKEUP_LABELS[value] })),
              ]}
              selected={draft.makeup ?? NONE}
              onSelect={(value) => patch("makeup", value === NONE ? null : value)}
            />
          )}

          {activeCategory === "background" && (
            <OptionPicker
              legend="Fondo"
              options={BACKGROUNDS.map((value) => ({ value, label: BACKGROUND_LABELS[value] }))}
              selected={draft.background}
              onSelect={(value) => patch("background", value)}
            />
          )}
        </div>

        {error && (
          <p className="avatar-editor-error" role="alert">
            {error}
          </p>
        )}

        <Button onClick={() => void handleSave()} isLoading={isSaving}>
          Guardar avatar
        </Button>
      </div>
    </GlamCard>
  );
}
