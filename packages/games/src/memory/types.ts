/** Identificador del simbolo que lleva una carta. Dos cartas con el mismo
 *  symbolId forman pareja. El dibujo de cada simbolo vive en el cliente. */
export type SymbolId = string;

export interface MemoryCard {
  id: string;
  symbolId: SymbolId;
}

export interface MemoryPuzzle {
  /** Cartas ya barajadas, listas para pintar en cuadricula. */
  cards: MemoryCard[];
}
