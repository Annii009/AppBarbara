-- Amistades: una fila por cada direccion (si A es amiga de B, hay fila A->B
-- y fila B->A). Cuesta el doble en filas pero simplifica muchisimo la
-- consulta mas comun: "dame las amigas de X" es un simple WHERE user_id = X,
-- sin tener que mirar dos columnas a la vez.

CREATE TABLE friendships (
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  friend_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, friend_id)
);

CREATE INDEX idx_friendships_friend ON friendships (friend_id);
