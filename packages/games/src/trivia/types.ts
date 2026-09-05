export interface TriviaQuestion {
  id: string;
  question: string;
  options: readonly string[];
  /** Indice (dentro de options) de la respuesta correcta. */
  correctIndex: number;
}
