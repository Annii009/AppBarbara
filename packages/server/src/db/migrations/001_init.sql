-- Migracion inicial: usuarios y avatares.
--
-- Notas de diseno:
--  * Los ids son TEXT (UUID) en vez de enteros autoincrementales. Asi un id no
--    revela cuantos usuarios hay ni permite recorrer perfiles ajenos probando
--    numeros consecutivos.
--  * nick_lower existe para que la unicidad sea insensible a mayusculas: no
--    queremos que convivan "Barbara" y "barbara".
--  * Las fechas se guardan como TEXT ISO-8601 en UTC. SQLite no tiene tipo
--    fecha y el texto ISO ordena correctamente con comparaciones normales.

CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  nick          TEXT NOT NULL,
  nick_lower    TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  friend_code   TEXT NOT NULL UNIQUE,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_users_friend_code ON users (friend_code);

-- Un avatar por usuario (relacion 1:1). Si se borra el usuario, su avatar se va
-- con el gracias a ON DELETE CASCADE.
CREATE TABLE avatars (
  user_id    TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  skin_tone  TEXT NOT NULL,
  hair_style TEXT NOT NULL,
  hair_color TEXT NOT NULL,
  outfit     TEXT NOT NULL,
  accessory  TEXT,
  makeup     TEXT,
  background TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
