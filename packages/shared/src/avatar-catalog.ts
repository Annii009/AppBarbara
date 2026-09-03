/**
 * Catalogo de opciones de avatar: la lista cerrada de ids validos por
 * categoria. Cliente y servidor comparten este archivo por dos motivos:
 *  - El cliente lo usa para saber que opciones pintar en el editor.
 *  - El servidor lo usa para rechazar cualquier avatar que no use ids de
 *    aqui, sin tener que fiarse de lo que mande el navegador.
 *
 * El dibujo (SVG, formas exactas) vive solo en el cliente: aqui solo hay
 * identidad de datos y textos, nunca trazos.
 */

export const SKIN_TONES = ["skin-porcelain", "skin-warm", "skin-tan", "skin-deep"] as const;
export type SkinTone = (typeof SKIN_TONES)[number];

export const HAIR_STYLES = [
  "hair-long-wavy",
  "hair-bob",
  "hair-ponytail",
  "hair-curly-bun",
  "hair-braid",
] as const;
export type HairStyle = (typeof HAIR_STYLES)[number];

export const HAIR_COLORS = ["hair-blonde", "hair-brunette", "hair-pink", "hair-platinum"] as const;
export type HairColor = (typeof HAIR_COLORS)[number];

export const OUTFITS = [
  "outfit-casual-pink",
  "outfit-party-dress",
  "outfit-sporty",
  "outfit-denim",
  "outfit-summer",
  "outfit-gala-gold",
] as const;
export type Outfit = (typeof OUTFITS)[number];

export const ACCESSORIES = [
  "accessory-tiara",
  "accessory-sunglasses",
  "accessory-bow",
  "accessory-earrings",
] as const;
export type Accessory = (typeof ACCESSORIES)[number];

export const MAKEUPS = ["makeup-rosy-cheeks", "makeup-glam-lips", "makeup-sparkle-eyes"] as const;
export type Makeup = (typeof MAKEUPS)[number];

export const BACKGROUNDS = ["bg-studio-pink", "bg-dream-clouds", "bg-starry-night"] as const;
export type Background = (typeof BACKGROUNDS)[number];

// ---------------------------------------------------------------------------
// Metadatos para el editor (nombres, colores de muestra)
// ---------------------------------------------------------------------------

export const SKIN_TONE_LABELS: Record<SkinTone, string> = {
  "skin-porcelain": "Porcelana",
  "skin-warm": "Calido",
  "skin-tan": "Bronceado",
  "skin-deep": "Profundo",
};

export const SKIN_TONE_SWATCHES: Record<SkinTone, string> = {
  "skin-porcelain": "#ffe0c7",
  "skin-warm": "#f0b98d",
  "skin-tan": "#c98657",
  "skin-deep": "#8a5636",
};

export const HAIR_STYLE_LABELS: Record<HairStyle, string> = {
  "hair-long-wavy": "Ondulado largo",
  "hair-bob": "Bob corto",
  "hair-ponytail": "Coleta alta",
  "hair-curly-bun": "Moño rizado",
  "hair-braid": "Trenza lateral",
};

export const HAIR_COLOR_LABELS: Record<HairColor, string> = {
  "hair-blonde": "Rubio",
  "hair-brunette": "Castaño",
  "hair-pink": "Rosa",
  "hair-platinum": "Platino",
};

export const HAIR_COLOR_SWATCHES: Record<HairColor, string> = {
  "hair-blonde": "#f0cf6b",
  "hair-brunette": "#6b4030",
  "hair-pink": "#ff8fc7",
  "hair-platinum": "#e8e4f0",
};

export const OUTFIT_LABELS: Record<Outfit, string> = {
  "outfit-casual-pink": "Casual rosa",
  "outfit-party-dress": "Vestido de fiesta",
  "outfit-sporty": "Deportivo",
  "outfit-denim": "Denim",
  "outfit-summer": "Verano",
  "outfit-gala-gold": "Gala dorada",
};

export const ACCESSORY_LABELS: Record<Accessory, string> = {
  "accessory-tiara": "Tiara",
  "accessory-sunglasses": "Gafas de sol",
  "accessory-bow": "Lazo",
  "accessory-earrings": "Pendientes",
};

export const MAKEUP_LABELS: Record<Makeup, string> = {
  "makeup-rosy-cheeks": "Mejillas sonrosadas",
  "makeup-glam-lips": "Labios glam",
  "makeup-sparkle-eyes": "Ojos con brillo",
};

export const BACKGROUND_LABELS: Record<Background, string> = {
  "bg-studio-pink": "Estudio rosa",
  "bg-dream-clouds": "Nubes de ensueño",
  "bg-starry-night": "Noche estrellada",
};

// ---------------------------------------------------------------------------
// Configuracion completa y validacion
// ---------------------------------------------------------------------------

/** Partes del avatar que el usuario puede combinar. */
export interface AvatarConfig {
  skinTone: SkinTone;
  hairStyle: HairStyle;
  hairColor: HairColor;
  outfit: Outfit;
  accessory: Accessory | null;
  makeup: Makeup | null;
  background: Background;
}

function isOneOf<T extends readonly string[]>(list: T, value: unknown): value is T[number] {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

/**
 * Valida un avatar sin fiarse del cliente. El servidor la usa antes de
 * guardar nada: cualquier id que no venga de este catalogo se rechaza.
 */
export function isValidAvatarConfig(value: unknown): value is AvatarConfig {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    isOneOf(SKIN_TONES, v["skinTone"]) &&
    isOneOf(HAIR_STYLES, v["hairStyle"]) &&
    isOneOf(HAIR_COLORS, v["hairColor"]) &&
    isOneOf(OUTFITS, v["outfit"]) &&
    (v["accessory"] === null || isOneOf(ACCESSORIES, v["accessory"])) &&
    (v["makeup"] === null || isOneOf(MAKEUPS, v["makeup"])) &&
    isOneOf(BACKGROUNDS, v["background"])
  );
}
