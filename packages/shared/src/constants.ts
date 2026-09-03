/** Constantes compartidas: reglas de validacion que aplican cliente y servidor. */

import type { AvatarConfig } from "./avatar-catalog.ts";

export const NICK_MIN_LENGTH = 3;
export const NICK_MAX_LENGTH = 16;
/** Letras, numeros, guion bajo y guion. Sin espacios ni acentos, para que el
 *  codigo de amiga y las busquedas sean predecibles. */
export const NICK_PATTERN = /^[a-zA-Z0-9_-]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/** Prefijo de los codigos de amiga. Ej: "BRB-7K2Q". */
export const FRIEND_CODE_PREFIX = "BRB";

export const MESSAGE_MAX_LENGTH = 500;

/** Ruta base de la API. El cliente la usa para construir las URLs. */
export const API_BASE_PATH = "/api";

/**
 * Avatar con el que arranca cualquier cuenta nueva. El editor (fase 1.3) le
 * dara opciones reales; por ahora solo hace falta que exista para que el
 * registro cree una fila valida en la tabla avatars.
 */
export const DEFAULT_AVATAR: AvatarConfig = {
  skinTone: "skin-warm",
  hairStyle: "hair-long-wavy",
  hairColor: "hair-blonde",
  outfit: "outfit-casual-pink",
  accessory: null,
  makeup: null,
  background: "bg-studio-pink",
};
