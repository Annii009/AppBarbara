import {
  BACKGROUND_LABELS,
  HAIR_COLOR_SWATCHES,
  SKIN_TONE_SWATCHES,
  type AvatarConfig,
} from "@minibarbara/shared";
import "./AvatarRenderer.css";

interface AvatarRendererProps {
  avatar: AvatarConfig;
  size?: number;
  /**
   * "bust": cabeza y hombros en un marco cuadrado — pensado para los
   * circulitos pequenos (perfil, lista de amigas, cabecera del chat), donde
   * un cuerpo entero no cabe ni tiene sentido. Es el valor por defecto.
   * "full": cuerpo entero, para la vista grande del editor de avatar.
   */
  variant?: "bust" | "full";
}

/** Colores fijos de cada prenda: aqui "outfit" ya trae su propia paleta, no
 *  se recolorea por separado como el pelo o la piel. */
const OUTFIT_COLORS: Record<AvatarConfig["outfit"], { primary: string; accent: string }> = {
  "outfit-casual-pink": { primary: "#ff8fc7", accent: "#ffd9ea" },
  "outfit-party-dress": { primary: "#ec2b8a", accent: "#f7cf6b" },
  "outfit-sporty": { primary: "#9fe8cd", accent: "#2fae7e" },
  "outfit-denim": { primary: "#a8d8f8", accent: "#5b8fb0" },
  "outfit-summer": { primary: "#ffe066", accent: "#ff9f6b" },
  "outfit-gala-gold": { primary: "#f7cf6b", accent: "#eeb52f" },
};

/** Alto/ancho del viewBox del cuerpo entero: el marco exterior usa esta
 *  proporcion para no salir cuadrado cuando variant="full". */
const FULL_BODY_ASPECT = 420 / 200;

/**
 * Dibuja el avatar en un unico SVG a partir de su configuracion.
 *
 * Truco de "pelo detras de la cara": cada peinado es una forma grande
 * dibujada ANTES que el circulo de la cara, asi que la cara lo tapa por el
 * centro y solo se ve el contorno del pelo alrededor. Es lo que permite
 * combinar 5 peinados x 4 colores x 4 tonos de piel sin dibujar decenas de
 * variantes. La cabeza (cx=100 cy=92 r=52) es identica en los dos modos:
 * "full" simplemente anade cuerpo alrededor y debajo, sin tocar la cara.
 */
export function AvatarRenderer({
  avatar,
  size = 160,
  variant = "bust",
}: AvatarRendererProps): React.JSX.Element {
  const skin = SKIN_TONE_SWATCHES[avatar.skinTone];
  const hairColor = HAIR_COLOR_SWATCHES[avatar.hairColor];
  const outfit = OUTFIT_COLORS[avatar.outfit];
  const isFull = variant === "full";

  return (
    <div
      className="avatar-frame"
      data-background={avatar.background}
      data-variant={variant}
      style={{ width: size, height: isFull ? size * FULL_BODY_ASPECT : size }}
      role="img"
      aria-label={`Avatar con fondo ${BACKGROUND_LABELS[avatar.background].toLowerCase()}`}
    >
      <svg viewBox={isFull ? "0 0 200 420" : "0 0 200 220"} width="100%" height="100%">
        {isFull ? (
          <>
            {renderGroundShadow()}
            {renderHair(avatar.hairStyle, hairColor)}
            {renderLegs(skin)}
            {renderBoots(outfit.accent)}
            {renderTorsoFull(outfit)}
            {renderNeck(skin)}
            <circle cx="100" cy="92" r="52" fill={skin} />
            {renderFace(avatar.makeup)}
            {renderArms(skin)}
            {renderAccessory(avatar.accessory)}
          </>
        ) : (
          <>
            {renderHair(avatar.hairStyle, hairColor)}
            {renderOutfitBust(outfit)}
            <circle cx="100" cy="92" r="52" fill={skin} />
            {renderFace(avatar.makeup)}
            {renderAccessory(avatar.accessory)}
          </>
        )}
      </svg>
    </div>
  );
}

function renderHair(style: AvatarConfig["hairStyle"], color: string): React.JSX.Element {
  switch (style) {
    case "hair-long-wavy":
      return (
        <g fill={color}>
          <path d="M46 62 Q40 140 55 190 Q65 172 61 122 Q100 146 139 122 Q135 172 145 190 Q160 140 154 62 Q100 20 46 62 Z" />
          <circle cx="100" cy="80" r="56" />
          <path
            d="M52 130 Q46 165 58 195"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
          <path
            d="M148 130 Q154 165 142 195"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            opacity="0.85"
          />
        </g>
      );
    case "hair-bob":
      return (
        <g fill={color}>
          <path d="M42 96 Q37 146 58 162 Q53 120 60 100 Z" />
          <path d="M158 96 Q163 146 142 162 Q147 120 140 100 Z" />
          <circle cx="100" cy="78" r="55" />
        </g>
      );
    case "hair-ponytail":
      return (
        <g fill={color}>
          <circle cx="100" cy="80" r="54" />
          <path d="M149 68 Q184 88 173 152 Q159 142 154 110 Q151 92 149 68 Z" />
        </g>
      );
    case "hair-curly-bun":
      return (
        <g fill={color}>
          <circle cx="100" cy="80" r="54" />
          <circle cx="100" cy="32" r="20" />
          <circle cx="83" cy="40" r="10" />
          <circle cx="117" cy="40" r="10" />
        </g>
      );
    case "hair-braid":
      return (
        <g fill={color}>
          <circle cx="100" cy="80" r="54" />
          <path d="M138 74 Q152 90 142 108 Q156 116 144 132 Q158 140 146 158 Q152 172 138 178 Q148 158 136 148 Q150 138 136 126 Q150 116 134 104 Q146 92 138 74 Z" />
        </g>
      );
  }
}

/** Cara: cejas, ojos, y boca segun el maquillaje. Identica en ambos modos. */
function renderFace(makeup: AvatarConfig["makeup"]): React.JSX.Element {
  return (
    <>
      {makeup === "makeup-rosy-cheeks" && (
        <g fill="#ff9fc9" opacity="0.55">
          <ellipse cx="72" cy="102" rx="9" ry="6" />
          <ellipse cx="128" cy="102" rx="9" ry="6" />
        </g>
      )}

      <g stroke="#6b4c3a" strokeWidth="2.4" strokeLinecap="round" fill="none">
        <path d="M78 74 Q86 69 94 73" />
        <path d="M106 73 Q114 69 122 74" />
      </g>

      <g fill="#3a2430">
        <circle cx="86" cy="88" r="4" />
        <circle cx="118" cy="88" r="4" />
      </g>

      {makeup === "makeup-sparkle-eyes" && (
        <g fill="#ffffff">
          <circle cx="88.5" cy="85.5" r="1.6" />
          <circle cx="120.5" cy="85.5" r="1.6" />
        </g>
      )}

      {makeup === "makeup-glam-lips" ? (
        <path d="M87 118 Q100 130 113 118 Q100 123 87 118 Z" fill="#c2126c" />
      ) : (
        <path
          d="M90 106 Q100 112 110 106"
          stroke="#3a2430"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      )}
    </>
  );
}

/** Modo "bust": hombros insinuados, sin brazos ni piernas. */
function renderOutfitBust(colors: { primary: string; accent: string }): React.JSX.Element {
  return (
    <g>
      <path d="M38 220 Q38 148 100 143 Q162 148 162 220 Z" fill={colors.primary} />
      <path d="M70 158 Q100 174 130 158 L130 220 L70 220 Z" fill={colors.accent} opacity="0.65" />
    </g>
  );
}

/** Modo "full": vestido/torso con forma de campana y un cinturon decorativo. */
function renderTorsoFull(colors: { primary: string; accent: string }): React.JSX.Element {
  return (
    <g>
      <path d="M65 300 Q55 210 80 155 L120 155 Q145 210 135 300 Z" fill={colors.primary} />
      {/* Sombra suave en un lateral: da un poco de volumen sin complicar la forma. */}
      <path d="M100 165 Q125 220 120 300 L135 300 Q145 210 120 155 Z" fill="#000" opacity="0.07" />
      <path d="M78 232 Q100 246 122 232 L122 300 L78 300 Z" fill={colors.accent} opacity="0.35" />
      <rect x="72" y="194" width="56" height="9" rx="4.5" fill={colors.accent} opacity="0.9" />
    </g>
  );
}

function renderNeck(skin: string): React.JSX.Element {
  return <rect x="88" y="126" width="24" height="30" fill={skin} />;
}

function renderArms(skin: string): React.JSX.Element {
  return (
    <g fill={skin}>
      <path d="M78 158 Q56 178 53 218 Q52 230 62 228 Q66 198 82 166 Z" />
      <path d="M122 158 Q144 178 147 218 Q148 230 138 228 Q134 198 118 166 Z" />
      <circle cx="57" cy="226" r="8" />
      <circle cx="143" cy="226" r="8" />
    </g>
  );
}

/** Piernas estilizadas, algo mas largas y finas que unos "palitos" basicos,
 *  al estilo de un figurin de moda. Las botas (renderBoots) las cubren
 *  desde la rodilla para abajo. */
function renderLegs(skin: string): React.JSX.Element {
  return (
    <g fill={skin}>
      <rect x="80" y="295" width="14" height="48" rx="7" />
      <rect x="106" y="295" width="14" height="48" rx="7" />
    </g>
  );
}

/** Botas altas hasta la rodilla, en vez de un zapato plano: es el detalle
 *  que mas cambia el aire "de figurin" del dibujo. */
function renderBoots(accent: string): React.JSX.Element {
  return (
    <g fill={accent}>
      <path d="M77 330 H97 V378 Q97 386 89 386 H81 Q73 386 73 378 V342 Q73 334 77 330 Z" />
      <path d="M103 330 H123 V378 Q123 386 115 386 H107 Q99 386 99 378 V342 Q99 334 103 330 Z" />
    </g>
  );
}

/** Sombra de suelo, para que el personaje se sienta apoyada y no flotando. */
function renderGroundShadow(): React.JSX.Element {
  return <ellipse cx="100" cy="393" rx="42" ry="6" fill="#000" opacity="0.08" />;
}

function renderAccessory(accessory: AvatarConfig["accessory"]): React.JSX.Element | null {
  if (accessory === "accessory-tiara") {
    return (
      <path
        d="M66 46 L80 22 L92 40 L100 18 L108 40 L120 22 L134 46 Z"
        fill="#eeb52f"
        stroke="#c8901a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    );
  }
  if (accessory === "accessory-sunglasses") {
    return (
      <g fill="#4a2540" opacity="0.88">
        <rect x="72" y="80" width="24" height="14" rx="6" />
        <rect x="104" y="80" width="24" height="14" rx="6" />
        <rect x="96" y="85" width="8" height="3" />
      </g>
    );
  }
  if (accessory === "accessory-bow") {
    return (
      <path
        d="M50 52 Q38 42 40 56 Q38 70 50 62 Q58 68 58 56 Q58 44 50 52 Z"
        fill="#ec2b8a"
      />
    );
  }
  if (accessory === "accessory-earrings") {
    return (
      <g fill="#eeb52f">
        <circle cx="68" cy="102" r="3.5" />
        <circle cx="132" cy="102" r="3.5" />
      </g>
    );
  }
  return null;
}
