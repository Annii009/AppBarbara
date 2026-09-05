-- El mapa del mundo se elimino: ya no hay nodos que completar, solo los
-- retos diarios de daily_results. Sin usuarias reales todavia, se puede
-- borrar sin mas la tabla en lugar de migrar datos que no importan.

DROP TABLE IF EXISTS progress;
