import { createRng, type Difficulty, type Rng } from "@minibarbara/shared";
import { cloneGrid, createEmptyGrid, GRID_SIZE } from "./core.ts";
import type { SudokuGrid, SudokuPuzzle, SudokuValue } from "./types.ts";

/**
 * Cuantas casillas quedan vacias segun la dificultad (de 81 en total). Mas
 * huecos = menos pistas = mas dificil. Los valores estan dentro de los
 * rangos habituales de sudoku impreso: facil ~41 pistas, dificil ~31. No se
 * baja de ahi: por debajo de ~30 pistas, demostrar que la solucion sigue
 * siendo unica se vuelve computacionalmente caro (ver MAX_SEARCH_STEPS).
 */
const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 40,
  medium: 46,
  hard: 50,
};

const FULL_MASK = 0b111111111; // 9 bits: uno por valor 1-9

function boxIndex(row: number, col: number): number {
  return Math.floor(row / 3) * 3 + Math.floor(col / 3);
}

function popcount(mask: number): number {
  let count = 0;
  for (let m = mask; m !== 0; m &= m - 1) count++;
  return count;
}

function maskToValues(mask: number): SudokuValue[] {
  const values: SudokuValue[] = [];
  for (let value = 1; value <= 9; value++) {
    if (mask & (1 << (value - 1))) values.push(value);
  }
  return values;
}

/**
 * Estado auxiliar para resolver rapido. La version ingenua recalcula, para
 * cada celda vacia y en cada paso del backtracking, que valores ya estan
 * usados recorriendo entera su fila/columna/caja (27 casillas). Aqui se
 * mantienen tres bitmasks -uno por fila, columna y caja- que se actualizan en
 * O(1) al colocar o quitar un valor, así que preguntar "que valores caben en
 * esta celda" es una operacion a nivel de bits, no un recorrido. Esto es lo
 * que hace viable comprobar unicidad de un sudoku de pocas pistas en
 * milisegundos en vez de segundos.
 */
class SolverState {
  readonly grid: SudokuGrid;
  private readonly rowMasks = new Array<number>(GRID_SIZE).fill(0);
  private readonly colMasks = new Array<number>(GRID_SIZE).fill(0);
  private readonly boxMasks = new Array<number>(GRID_SIZE).fill(0);

  constructor(grid: SudokuGrid) {
    this.grid = grid;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const value = grid[row]?.[col] ?? 0;
        if (value !== 0) this.place(row, col, value);
      }
    }
  }

  candidatesMask(row: number, col: number): number {
    const used =
      (this.rowMasks[row] ?? 0) | (this.colMasks[col] ?? 0) | (this.boxMasks[boxIndex(row, col)] ?? 0);
    return FULL_MASK & ~used;
  }

  place(row: number, col: number, value: SudokuValue): void {
    const bit = 1 << (value - 1);
    this.rowMasks[row] = (this.rowMasks[row] ?? 0) | bit;
    this.colMasks[col] = (this.colMasks[col] ?? 0) | bit;
    const box = boxIndex(row, col);
    this.boxMasks[box] = (this.boxMasks[box] ?? 0) | bit;
    const gridRow = this.grid[row];
    if (gridRow) gridRow[col] = value;
  }

  clear(row: number, col: number, value: SudokuValue): void {
    const bit = ~(1 << (value - 1));
    this.rowMasks[row] = (this.rowMasks[row] ?? 0) & bit;
    this.colMasks[col] = (this.colMasks[col] ?? 0) & bit;
    const box = boxIndex(row, col);
    this.boxMasks[box] = (this.boxMasks[box] ?? 0) & bit;
    const gridRow = this.grid[row];
    if (gridRow) gridRow[col] = 0;
  }
}

interface ConstrainedCell {
  row: number;
  col: number;
  mask: number;
  count: number;
}

/**
 * Celda vacia con menos candidatos ahora mismo (MRV: "minimum remaining
 * values"). Resolverla primero es lo que hace rapido tanto generar como
 * comprobar unicidad: se falla pronto en los callejones sin salida en vez de
 * rellenar 70 casillas para descubrir el error en la ultima.
 */
function mostConstrainedCell(state: SolverState): ConstrainedCell | null {
  let best: ConstrainedCell | null = null;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (state.grid[row]?.[col] !== 0) continue;
      const mask = state.candidatesMask(row, col);
      const count = popcount(mask);
      if (!best || count < best.count) {
        best = { row, col, mask, count };
        if (count <= 1) return best; // no se puede estar mas restringido
      }
    }
  }
  return best;
}

/** Rellena un tablero vacio con una solucion completa y valida, al azar. */
export function generateSolvedGrid(rng: Rng): SudokuGrid {
  const grid = createEmptyGrid();
  const state = new SolverState(grid);

  function fill(): boolean {
    const target = mostConstrainedCell(state);
    if (!target) return true; // sin celdas vacias: completo
    if (target.count === 0) return false; // celda sin candidatos: callejon sin salida

    for (const value of rng.shuffle(maskToValues(target.mask))) {
      state.place(target.row, target.col, value);
      if (fill()) return true;
      state.clear(target.row, target.col, value);
    }
    return false;
  }

  fill();
  return grid;
}

const MAX_SOLUTIONS_TO_FIND = 2;
/**
 * Techo de nodos explorados por comprobacion de unicidad. Incluso con las
 * mascaras de bits, un tablero de muy pocas pistas puede tener un arbol de
 * busqueda enorme. Con este limite, cada intento de "cavar un hueco" cuesta
 * como mucho esto; sin el, el generador podria colgarse.
 */
const MAX_SEARCH_STEPS = 20_000;

/**
 * Cuenta soluciones del tablero, parando en cuanto encuentra
 * MAX_SOLUTIONS_TO_FIND. No hace falta saber si hay 3 o 300: en cuanto hay
 * mas de una, el puzzle ya no vale (un sudoku de verdad tiene solucion
 * unica).
 *
 * Devuelve `null` si se alcanza MAX_SEARCH_STEPS sin terminar de contar: eso
 * significa "no lo sabemos con certeza", y quien llama debe tratarlo como
 * "no queda demostrado que sea unica" en vez de asumir que lo es.
 */
function countSolutions(grid: SudokuGrid, limit = MAX_SOLUTIONS_TO_FIND): number | null {
  const state = new SolverState(grid);
  let count = 0;
  let steps = 0;
  let aborted = false;

  function search(): boolean {
    if (++steps > MAX_SEARCH_STEPS) {
      aborted = true;
      return true;
    }

    const target = mostConstrainedCell(state);
    if (!target) {
      count++;
      return count >= limit; // true = ya hemos visto suficientes, para de buscar
    }
    if (target.count === 0) return false; // callejon sin salida

    for (const value of maskToValues(target.mask)) {
      state.place(target.row, target.col, value);
      const stop = search();
      state.clear(target.row, target.col, value);
      if (stop) return true;
    }
    return false;
  }

  search();
  return aborted ? null : count;
}

/**
 * "Cava huecos" en una solucion completa: quita casillas de una en una, en
 * orden aleatorio, y solo se queda con el hueco si el tablero sigue teniendo
 * solucion unica. Si quitar una casilla abre una segunda solucion posible (o
 * no se puede confirmar dentro del limite de pasos), se devuelve esa casilla
 * a su valor original y se prueba con la siguiente.
 */
function digHoles(solution: SudokuGrid, targetRemovals: number, rng: Rng): SudokuGrid {
  const puzzle = cloneGrid(solution);

  const positions = rng.shuffle(
    Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => ({
      row: Math.floor(index / GRID_SIZE),
      col: index % GRID_SIZE,
    })),
  );

  let removed = 0;
  for (const { row, col } of positions) {
    if (removed >= targetRemovals) break;

    const puzzleRow = puzzle[row];
    if (!puzzleRow) continue;

    const previousValue = puzzleRow[col];
    puzzleRow[col] = 0;

    const solutions = countSolutions(puzzle);
    if (solutions === null || solutions > 1) {
      puzzleRow[col] = previousValue as SudokuValue;
      continue;
    }
    removed++;
  }

  return puzzle;
}

/**
 * Genera un sudoku completo a partir de una semilla: misma seed + dificultad
 * siempre dan exactamente el mismo puzzle. Es la pieza que permitira, mas
 * adelante, que el reto diario sea identico para todo el mundo sin guardar
 * nada en la base de datos (ver packages/shared/src/seed.ts).
 */
export function generateSudokuPuzzle(seed: string, difficulty: Difficulty): SudokuPuzzle {
  const rng = createRng(seed);
  const solution = generateSolvedGrid(rng);
  const puzzle = digHoles(solution, CELLS_TO_REMOVE[difficulty], rng);
  return { puzzle, solution };
}
