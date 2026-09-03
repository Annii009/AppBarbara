import type { Difficulty, GameId } from "./types.ts";

/**
 * El "camino" del mundo: una serie fija de paradas que cuentan, en pequenas
 * dosis, la historia de Barbara montando su boutique. Cada parada es una
 * partida de un minijuego con una configuracion concreta (no un picker
 * libre). Es contenido estatico -igual que el catalogo de avatar- asi que
 * vive aqui, compartido: el cliente lo usa para pintar el mapa y el servidor
 * lo usa para no fiarse de un nodeId que el navegador diga haber completado
 * sin haber completado antes los que hacian falta.
 */
export interface WorldNode {
  id: string;
  title: string;
  flavorText: string;
  gameId: GameId;
  config: { difficulty?: Difficulty; themeId?: string };
  /** Id del nodo que hay que completar antes. `null` = desbloqueado desde el principio. */
  requires: string | null;
}

export const WORLD_NODES: readonly WorldNode[] = [
  {
    id: "boutique-rosa",
    title: "La Boutique Rosa",
    flavorText:
      "Barbara acaba de abrir su primera boutique. Antes de nada, hay que ordenar el escaparate.",
    gameId: "sudoku",
    config: { difficulty: "easy" },
    requires: null,
  },
  {
    id: "armario-suenos",
    title: "El Armario de los Sueños",
    flavorText: "Entre tanta prenda nueva, algunas piezas se han escondido. ¿Las encuentras?",
    gameId: "wordsearch",
    config: { themeId: "moda" },
    requires: "boutique-rosa",
  },
  {
    id: "primeros-clientes",
    title: "Los Primeros Clientes",
    flavorText: "La boutique abre sus puertas. Hay que tenerlo todo listo antes de que lleguen.",
    gameId: "sudoku",
    config: { difficulty: "easy" },
    requires: "armario-suenos",
  },
  {
    id: "estudio-diseno",
    title: "El Estudio de Diseño",
    flavorText: "La boutique va tan bien que toca disenar la proxima coleccion. Un reto mas serio.",
    gameId: "sudoku",
    config: { difficulty: "medium" },
    requires: "primeros-clientes",
  },
  {
    id: "vuelta-al-mundo",
    title: "Vuelta al Mundo",
    flavorText: "Buscando inspiracion, Barbara viaja por el mundo. Encuentra las ciudades que visita.",
    gameId: "wordsearch",
    config: { themeId: "ciudades" },
    requires: "estudio-diseno",
  },
  {
    id: "inspiracion-parisina",
    title: "Inspiración Parisina",
    flavorText: "Entre bocetos y cafes, la nueva coleccion empieza a tomar forma.",
    gameId: "sudoku",
    config: { difficulty: "medium" },
    requires: "vuelta-al-mundo",
  },
  {
    id: "ensayo-general",
    title: "El Ensayo General",
    flavorText: "Antes del gran dia, un ultimo repaso al armario de la coleccion.",
    gameId: "wordsearch",
    config: { themeId: "moda" },
    requires: "inspiracion-parisina",
  },
  {
    id: "cuenta-atras",
    title: "Cuenta Atrás",
    flavorText: "Quedan horas para el desfile. Los nervios aprietan, pero todo tiene que salir perfecto.",
    gameId: "sudoku",
    config: { difficulty: "hard" },
    requires: "ensayo-general",
  },
  {
    id: "gran-gala",
    title: "La Gran Gala",
    flavorText: "La noche del gran desfile ha llegado. El reto mas dificil de todos, para cerrar con estilo.",
    gameId: "sudoku",
    config: { difficulty: "hard" },
    requires: "cuenta-atras",
  },
  {
    id: "fiesta-sorpresa",
    title: "La Fiesta Sorpresa",
    flavorText: "El desfile salio perfecto. Toca celebrar: encuentra las parejas antes de que empiece la musica.",
    gameId: "memory",
    config: {},
    requires: "gran-gala",
  },
  {
    id: "orden-en-la-boutique",
    title: "Orden en la Boutique",
    flavorText: "Al dia siguiente toca recoger. Junta las cajas iguales para dejarlo todo en su sitio.",
    gameId: "2048",
    config: {},
    requires: "fiesta-sorpresa",
  },
  {
    id: "ultimo-secreto",
    title: "El Ultimo Secreto",
    flavorText: "Antes de cerrar por hoy, un juego de mesa con las amigas: repite la secuencia si puedes.",
    gameId: "simon",
    config: {},
    requires: "orden-en-la-boutique",
  },
] as const;

export function findWorldNode(nodeId: string): WorldNode | undefined {
  return WORLD_NODES.find((node) => node.id === nodeId);
}

/** Un nodo esta desbloqueado si no requiere nada, o si lo que requiere ya esta completado. */
export function isNodeUnlocked(node: WorldNode, completedNodeIds: ReadonlySet<string>): boolean {
  return node.requires === null || completedNodeIds.has(node.requires);
}
