-- Progreso en el mapa de mundo.
--
-- El catalogo de nodos (que existen, en que orden, que requieren) es
-- contenido estatico que vive en packages/shared/src/world-map.ts, NO en esta
-- tabla: aqui solo se guarda que nodos ha completado cada usuaria. Si el mapa
-- cambia (se anaden nodos, se reordenan), no hace falta tocar la base de
-- datos.

CREATE TABLE progress (
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  node_id      TEXT NOT NULL,
  completed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  PRIMARY KEY (user_id, node_id)
);
