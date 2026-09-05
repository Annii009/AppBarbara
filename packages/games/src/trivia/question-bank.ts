import type { TriviaQuestion } from "./types.ts";

/**
 * Catalogo cerrado de preguntas de cultura general, sin nada que caduque
 * (fechas relativas, resultados deportivos, etc.) para que una pregunta de
 * hace un año siga siendo correcta hoy.
 */
export const TRIVIA_QUESTIONS: readonly TriviaQuestion[] = [
  { id: "q01", question: "¿Cual es la capital de Francia?", options: ["Roma", "Paris", "Berlin", "Madrid"], correctIndex: 1 },
  { id: "q02", question: "¿Cual es el pais mas grande del mundo por superficie?", options: ["Canada", "China", "Rusia", "Brasil"], correctIndex: 2 },
  { id: "q03", question: "¿En que continente esta Egipto?", options: ["Asia", "Africa", "Europa", "Oceania"], correctIndex: 1 },
  { id: "q04", question: "¿Cual es el rio mas largo del mundo?", options: ["Amazonas", "Misisipi", "Nilo", "Yangtse"], correctIndex: 2 },
  { id: "q05", question: "¿Cual es el oceano mas grande del planeta?", options: ["Atlantico", "Indico", "Artico", "Pacifico"], correctIndex: 3 },
  { id: "q06", question: "¿Que pais tiene forma de bota en el mapa?", options: ["Grecia", "Italia", "Portugal", "España"], correctIndex: 1 },
  { id: "q07", question: "¿Cual es la montaña mas alta del mundo?", options: ["K2", "Everest", "Kilimanjaro", "Aconcagua"], correctIndex: 1 },
  { id: "q08", question: "¿En que pais esta la Torre Eiffel?", options: ["Italia", "Reino Unido", "Francia", "España"], correctIndex: 2 },
  { id: "q09", question: "¿Cual es la capital de Japon?", options: ["Seul", "Tokio", "Pekin", "Bangkok"], correctIndex: 1 },
  { id: "q10", question: "¿Cual es la capital de España?", options: ["Barcelona", "Sevilla", "Madrid", "Valencia"], correctIndex: 2 },
  { id: "q11", question: "¿Que color tiene la sirenita Ariel de pelo?", options: ["Rubio", "Rojo", "Negro", "Castaño"], correctIndex: 1 },
  { id: "q12", question: "¿Quien tiene poderes de hielo en la pelicula Frozen?", options: ["Anna", "Elsa", "Rapunzel", "Merida"], correctIndex: 1 },
  { id: "q13", question: "¿Que superheroina es conocida por su lazo de la verdad?", options: ["Supergirl", "Catwoman", "Wonder Woman", "Harley Quinn"], correctIndex: 2 },
  { id: "q14", question: "¿En que ciudad transcurre la serie 'Friends'?", options: ["Chicago", "Nueva York", "Boston", "Los Angeles"], correctIndex: 1 },
  { id: "q15", question: "¿Que color se asocia tradicionalmente con Barbie?", options: ["Azul", "Amarillo", "Rosa", "Verde"], correctIndex: 2 },
  { id: "q16", question: "¿Cuantas cuerdas tiene una guitarra clasica?", options: ["4", "5", "8", "6"], correctIndex: 3 },
  { id: "q17", question: "¿Que instrumento musical tiene teclas blancas y negras?", options: ["Violin", "Piano", "Flauta", "Bateria"], correctIndex: 1 },
  { id: "q18", question: "¿Cuantas notas musicales basicas existen (do, re, mi...)?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  { id: "q19", question: "¿En que parte del cuerpo se lleva un collar?", options: ["Muñeca", "Cuello", "Tobillo", "Dedo"], correctIndex: 1 },
  { id: "q20", question: "¿Que color sale de mezclar azul y rojo?", options: ["Verde", "Naranja", "Morado", "Rosa"], correctIndex: 2 },
  { id: "q21", question: "¿Que dos colores forman el rosa?", options: ["Azul y amarillo", "Rojo y blanco", "Verde y azul", "Amarillo y rojo"], correctIndex: 1 },
  { id: "q22", question: "¿Cuantos colores tiene el arcoiris?", options: ["5", "6", "7", "8"], correctIndex: 2 },
  { id: "q23", question: "¿Cuantas patas tiene una araña?", options: ["6", "8", "10", "4"], correctIndex: 1 },
  { id: "q24", question: "¿Cual es el animal terrestre mas rapido del mundo?", options: ["Leon", "Caballo", "Guepardo", "Antilope"], correctIndex: 2 },
  { id: "q25", question: "¿Cuantos dias tiene un año bisiesto?", options: ["365", "364", "367", "366"], correctIndex: 3 },
  { id: "q26", question: "¿Cuantas estaciones tiene el año?", options: ["3", "4", "5", "2"], correctIndex: 1 },
  { id: "q27", question: "¿Cual es el planeta mas cercano al Sol?", options: ["Venus", "Tierra", "Mercurio", "Marte"], correctIndex: 2 },
  { id: "q28", question: "¿Cuantos planetas hay en el sistema solar?", options: ["7", "8", "9", "10"], correctIndex: 1 },
  { id: "q29", question: "¿De que color es la clorofila de las plantas?", options: ["Amarilla", "Roja", "Verde", "Azul"], correctIndex: 2 },
  { id: "q30", question: "¿Cuantos huesos tiene, aproximadamente, el cuerpo humano adulto?", options: ["150", "206", "300", "100"], correctIndex: 1 },
  { id: "q31", question: "¿Que organo del cuerpo bombea la sangre?", options: ["Pulmon", "Higado", "Corazon", "Riñon"], correctIndex: 2 },
  { id: "q32", question: "¿Que insecto produce la miel?", options: ["Hormigas", "Mariposas", "Avispas", "Abejas"], correctIndex: 3 },
  { id: "q33", question: "¿Cuantos dias tiene febrero en un año normal (no bisiesto)?", options: ["28", "30", "31", "29"], correctIndex: 0 },
  { id: "q34", question: "¿En que pais se origino la pizza margarita?", options: ["España", "Francia", "Italia", "Grecia"], correctIndex: 2 },
  { id: "q35", question: "¿Cuantos lados tiene un hexagono?", options: ["5", "6", "7", "8"], correctIndex: 1 },
  { id: "q36", question: "¿Que metal precioso se usa tipicamente en las alianzas de boda?", options: ["Plata", "Bronce", "Cobre", "Oro"], correctIndex: 3 },
  { id: "q37", question: "¿Que postre suele llevar velas en un cumpleaños?", options: ["Galleta", "Tarta", "Helado", "Flan"], correctIndex: 1 },
  { id: "q38", question: "¿Que pais tiene mas habitantes actualmente?", options: ["China", "Estados Unidos", "Indonesia", "India"], correctIndex: 3 },
  { id: "q39", question: "¿Cuantos lados tiene un triangulo?", options: ["3", "4", "5", "6"], correctIndex: 0 },
  { id: "q40", question: "¿Que fruta es amarilla y curvada?", options: ["Manzana", "Platano", "Pera", "Uva"], correctIndex: 1 },
] as const;
