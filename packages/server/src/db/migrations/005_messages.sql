-- Chat entre amigas: mensajes directos de una usuaria a otra. No hay
-- concepto de "sala": una conversacion es, simplemente, todos los mensajes
-- entre dos ids de usuaria en cualquier direccion, ordenados por fecha.

CREATE TABLE messages (
  id          TEXT PRIMARY KEY,
  sender_id   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  receiver_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Dos indices, uno por cada sentido de la conversacion: una consulta de
-- "mensajes entre A y B" filtra por (sender, receiver) o (receiver, sender)
-- segun quien mando cada mensaje, y ambos casos quedan cubiertos.
CREATE INDEX idx_messages_sender_receiver ON messages (sender_id, receiver_id, created_at);
CREATE INDEX idx_messages_receiver_sender ON messages (receiver_id, sender_id, created_at);
