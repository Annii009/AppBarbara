import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Hash de contrasenas con scrypt, nativo de Node. No anadimos bcrypt/argon2:
 * scrypt esta en el core desde hace anos, es una funcion de derivacion de
 * clave "memory-hard" (cara de paralelizar en GPU) y evita una dependencia
 * mas que compilar en cada maquina.
 *
 * Formato almacenado: "<salt-hex>:<hash-hex>".
 */

const scryptAsync = promisify(scrypt);

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;

  // timingSafeEqual exige buffers del mismo tamano, o lanza. Si difieren, la
  // contrasena ya es incorrecta, así que no hay nada que comparar de forma segura.
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}
