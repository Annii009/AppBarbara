/**
 * Vocabulario cerrado de palabras de 5 letras (sin acentos ni enes, igual que
 * la sopa de letras: simplifica la comparacion letra a letra). Tanto la
 * palabra secreta como cada intento salen de esta misma lista — no hace
 * falta un diccionario enorme para un juego casual, y mantiene la
 * verificacion del servidor tan simple como la del resto de motores.
 */
export const WORD_LENGTH = 5;
export const MAX_ATTEMPTS = 6;

export const WORD_LIST: readonly string[] = [
  "PLATO", "NOCHE", "LIBRO", "VERDE", "PLAYA", "DULCE", "FRUTA", "ROSAS",
  "PERLA", "BAILE", "CIELO", "NIEVE", "LUCES", "BRISA", "ARENA", "FUEGO",
  "LUNAS", "MARES", "VIAJE", "DANZA", "CANTO", "RITMO", "MAGIA", "TARTA",
  "QUESO", "LECHE", "LIMON", "FRESA", "PERAS", "MELON", "MANGO", "PIZZA",
  "PASTA", "SALSA", "TACOS", "AGUAS", "NARIZ", "MANOS", "DEDOS", "CEJAS",
  "LABIO", "BRAZO", "CODOS", "FALDA", "BOTAS", "BOLSO", "GORRA", "GAFAS",
  "RELOJ", "JOYAS", "COLOR", "NEGRO", "PLATA", "GEMAS", "ARCOS", "NUBES",
  "CALOR", "OTONO", "BARCO", "VOLAR", "SOLAR", "LUNAR", "GLOBO", "VELAS",
  "CINTA", "LAZOS", "CAJAS", "POEMA", "NOVIA", "NOVIO", "AMIGA", "AMIGO",
  "PRIMA", "PRIMO", "MADRE", "PADRE", "HIJAS", "NINAS", "CREMA", "RIMEL",
  "POLVO", "BOLSA", "TACON", "BLUSA", "TRAJE", "MEDIA",
] as const;

const WORD_SET: ReadonlySet<string> = new Set(WORD_LIST);

/** ¿Es una palabra reconocida por el catalogo (mayusculas o minusculas)? */
export function isKnownWord(word: string): boolean {
  return WORD_SET.has(word.toUpperCase());
}
