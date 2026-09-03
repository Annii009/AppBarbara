import type { AvatarConfig } from "@minibarbara/shared";
import type { AvatarRow } from "./avatar.repo.ts";

/**
 * Convierte una fila SQL en el AvatarConfig tipado del contrato.
 *
 * Las columnas de la tabla son TEXT sin restriccion (SQLite no tiene enums):
 * a nivel de tipos, forzar aqui el string a los literales de union es seguro
 * porque la unica forma de escribir estas columnas es a traves de
 * isValidAvatarConfig (ver avatar.service.ts) o de DEFAULT_AVATAR. Si un
 * valor esta en la base de datos, es por construccion un id valido del
 * catalogo.
 */
export function avatarRowToConfig(row: AvatarRow): AvatarConfig {
  return {
    skinTone: row.skin_tone as AvatarConfig["skinTone"],
    hairStyle: row.hair_style as AvatarConfig["hairStyle"],
    hairColor: row.hair_color as AvatarConfig["hairColor"],
    outfit: row.outfit as AvatarConfig["outfit"],
    accessory: row.accessory as AvatarConfig["accessory"],
    makeup: row.makeup as AvatarConfig["makeup"],
    background: row.background as AvatarConfig["background"],
  };
}
