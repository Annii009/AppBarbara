-- Reto diario: una fila por usuaria y dia en que lo completo.
--
-- game_day es el "dia de juego" en formato YYYY-MM-DD en UTC (ver
-- currentGameDay en packages/shared/src/seed.ts), no la fecha de created_at:
-- es lo que hace que el reto sea el mismo, un dia entero, para todo el mundo.
-- No se guarda el puzzle: se regenera siempre a partir de la semilla del dia.

CREATE TABLE daily_results (
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  game_day     TEXT NOT NULL,
  elapsed_ms   INTEGER NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, game_day)
);

CREATE INDEX idx_daily_results_user_day ON daily_results (user_id, game_day);
