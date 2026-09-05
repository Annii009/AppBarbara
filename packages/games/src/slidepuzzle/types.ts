/** Cuadricula 4x4: numeros 1-15 en su celda, 0 representa el hueco vacio. */
export type SlideGrid = number[][];

/** Hacia donde se mueve el HUECO (no la ficha) al pulsar una direccion. */
export type SlideDirection = "up" | "down" | "left" | "right";
