import process from "node:process";
import type { Server } from "node:http";
import { createApp } from "./app.ts";
import { assertProductionConfig, env } from "./config/env.ts";
import { closeDb, getDb } from "./db/index.ts";

assertProductionConfig();

// Abrimos la base de datos al arrancar (y no en la primera peticion) para que
// un fallo de migracion se vea aqui, en el arranque, y no en cara al usuario.
getDb();

const app = createApp();

/**
 * En desarrollo, `tsx watch` mata el proceso anterior y arranca uno nuevo en
 * cuanto detecta un cambio de archivo. En Windows, el puerto a veces tarda
 * unos cientos de ms en liberarse del proceso saliente, y el nuevo revienta
 * con EADDRINUSE antes de que le de tiempo. Reintentar unas pocas veces con
 * una espera corta absorbe esa carrera de reinicio sin enmascarar un
 * conflicto de puerto real: en produccion, donde nada reinicia el proceso
 * cada pocos segundos, un puerto ocupado sigue fallando a la primera.
 */
const LISTEN_RETRY_ATTEMPTS = env.isProduction ? 1 : 30;
const LISTEN_RETRY_DELAY_MS = 400;

function startServer(attempt = 1): void {
  const server: Server = app.listen(env.port, () => {
    console.log(`[server] miniBarbara escuchando en http://localhost:${env.port}`);
    console.log(`[server] base de datos: ${env.databasePath}`);
    attachShutdown(server);
  });

  server.once("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE" && attempt < LISTEN_RETRY_ATTEMPTS) {
      console.log(
        `[server] puerto ${env.port} aun ocupado (seguramente el proceso anterior todavia esta cerrando), reintentando...`,
      );
      setTimeout(() => startServer(attempt + 1), LISTEN_RETRY_DELAY_MS);
      return;
    }
    throw error;
  });
}

/**
 * Apagado limpio: cerramos primero de aceptar conexiones y despues la base de
 * datos. Sin esto, Ctrl+C puede dejar el archivo WAL de SQLite a medias.
 *
 * `closeAllConnections()` es la parte que importa de verdad: `server.close()`
 * por si solo deja de aceptar conexiones NUEVAS pero espera a que las
 * conexiones keep-alive existentes (un navegador con la pestana abierta, o
 * incluso curl reusando la conexion) se cierren por su cuenta antes de llamar
 * a su callback. Si nada las cierra, esa espera no termina nunca: el proceso
 * se queda vivo, el puerto nunca se libera, y el siguiente arranque de
 * `tsx watch` revienta con EADDRINUSE para siempre. Forzar el cierre de todas
 * las conexiones aqui es lo que hace que el apagado sea instantaneo de verdad.
 */
function attachShutdown(server: Server): void {
  function shutdown(signal: string): void {
    console.log(`\n[server] ${signal} recibido, cerrando...`);
    server.closeAllConnections();
    server.close(() => {
      closeDb();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer();
