import { Router } from "express";
import { currentGameDay, type HealthResponse } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";

/**
 * Endpoint de diagnostico. Sirve para dos cosas:
 *  1. Comprobar de un vistazo que el servidor arranca y la base de datos
 *     responde de verdad (no solo que el proceso esta vivo).
 *  2. Que el cliente pueda mostrar el "dia de juego" en curso, que se calcula
 *     en UTC y no coincide con la fecha local del navegador.
 */
export const healthRouter: Router = Router();

healthRouter.get("/health", (_req, res) => {
  let db: HealthResponse["db"] = "ok";
  try {
    // Consulta trivial pero real: confirma que el archivo existe, esta migrado
    // y se puede leer. Un simple "el proceso responde" no probaria nada de eso.
    getDb().prepare("SELECT count(*) AS n FROM _migrations").get();
  } catch (error) {
    console.error("[health] la base de datos no responde:", error);
    db = "error";
  }

  const body: HealthResponse = {
    status: "ok",
    version: "0.1.0",
    gameDay: currentGameDay(),
    db,
  };
  res.json(body);
});
