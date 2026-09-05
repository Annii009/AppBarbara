-- Cambio de modelo del reto diario: antes rotaba un unico juego por dia (una
-- fila por usuaria y dia). Ahora CADA minijuego tiene su propio reto diario
-- simultaneo, asi que hace falta una fila por usuaria, dia Y juego.
--
-- Se recrea la tabla entera en vez de migrar filas viejas: no hay usuarias
-- reales todavia (la app no esta desplegada), y las filas antiguas no
-- tendrian un game_id fiable con el que rellenarse.

DROP TABLE IF EXISTS daily_results;

CREATE TABLE daily_results (
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  game_id      TEXT NOT NULL,
  game_day     TEXT NOT NULL,
  elapsed_ms   INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, game_id, game_day)
);

-- Para el ranking de un juego+dia concreto entre una lista de amigas.
CREATE INDEX idx_daily_results_game_day ON daily_results (game_id, game_day);
