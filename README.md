# miniBarbara

Un mundo de minijuegos con estetica glam: avatar propio, un camino de niveles
con hilo narrativo, casa decorable y un reto nuevo cada dia, con ranking entre
amigas.

Todo el proyecto usa unicamente herramientas de codigo abierto y gratuitas.
En desarrollo no depende de ningun servicio externo: base de datos y servidor
corren en tu propia maquina.

## Arrancar

```bash
npm install
cp packages/server/.env.example packages/server/.env   # solo la primera vez
npm run dev
```

- Cliente: http://localhost:5173
- API: http://localhost:4000/api/health

`npm run dev` levanta servidor y cliente a la vez. El cliente llama siempre a
rutas relativas (`/api/...`); en desarrollo Vite las redirige al puerto 4000.

## Comandos

| Comando | Que hace |
| --- | --- |
| `npm run dev` | Servidor + cliente en paralelo |
| `npm run dev:server` | Solo la API |
| `npm run dev:client` | Solo el frontend |
| `npm run typecheck` | Comprueba tipos en los tres paquetes |
| `npm run build` | Compila el cliente a `packages/client/dist` |
| `npm test` | Tests de los paquetes que los tengan |

## Estructura

```
packages/
  shared/   Contrato cliente-servidor: tipos, constantes y semillas deterministas
  games/    Motores de minijuegos, logica pura sin UI (sudoku por ahora)
  server/   API Node + Express + SQLite
  client/   React + Vite (PWA)
  ui/       (proximamente) Componentes del tema, cuando haya mas de un consumidor
```

### Dos ideas que sostienen el resto

**Semillas deterministas.** Los puzzles no se guardan en base de datos: se
generan a partir de una semilla derivada de la fecha (`packages/shared/src/seed.ts`).
Mismo dia, mismo puzzle para todo el mundo. El servidor puede regenerar y
verificar cualquier partida sin haber almacenado nada.

**Motores separados de la UI.** La logica de cada minijuego vive en `games/`
como funciones puras. Eso permite ejecutarla tambien en el servidor para validar
puntuaciones (si no, cualquiera se pone primera en el ranking desde la consola
del navegador) y probarla sin abrir un navegador.

## Base de datos

SQLite, un unico archivo en `packages/server/data/minibarbara.sqlite`, ignorado
por git. El esquema son archivos `.sql` numerados en
`packages/server/src/db/migrations/`, que se aplican solos al arrancar.

Para empezar de cero: para el servidor y borra la carpeta `data/`.

## Autenticacion

Nick + contrasena, sin email (evita depender de un servicio de envio de
correo). La sesion viaja en una cookie `httpOnly` firmada con HMAC-SHA256
(`packages/server/src/lib/session.ts`) — nunca en `localStorage`, que
cualquier script inyectado podria leer. Las contrasenas se derivan con
`scrypt` del propio Node (`packages/server/src/lib/password.ts`), sin
dependencias externas. Login y registro estan limitados a 30 intentos cada 15
minutos por IP.

## Avatar

Catalogo cerrado de opciones (tono de piel, 5 peinados, 4 colores de pelo, 6
ropas, 4 accesorios, 3 maquillajes, 3 fondos) definido una vez en
`packages/shared/src/avatar-catalog.ts` y compartido por cliente y servidor.
El servidor nunca confia en lo que mande el navegador: `isValidAvatarConfig`
rechaza cualquier combinacion con un id que no exista en el catalogo antes de
guardar nada (`packages/server/src/modules/avatar/avatar.service.ts`). El
dibujo (SVG, formas y colores) vive solo en el cliente
(`packages/client/src/features/avatar/AvatarRenderer.tsx`); ampliar el
catalogo mas adelante es anadir un id y su forma, no rediseñar el sistema.

## Minijuegos

Cada motor vive en `packages/games/`, es TypeScript puro sin dependencias de
Node (corre igual en el navegador que en el servidor) y tiene sus propios
tests (`node --test`).

**Sudoku** (`packages/games/src/sudoku/`): genera por "cavado de huecos" — 
parte de una solucion completa y quita casillas mientras un solver con
backtracking (optimizado con mascaras de bits) confirma que la solucion
sigue siendo unica, con un limite de pasos de busqueda para que nunca se
quede colgado en una combinacion patologica. 13 tests.

**Sopa de letras** (`packages/games/src/wordsearch/`): coloca palabras (las
mas largas primero, permitiendo que se crucen) en 8 direcciones y rellena el
resto al azar; dos temas por ahora (moda, ciudades). Interaccion por arrastre
unificada para raton y tactil con la Pointer Events API.

**Memorama** (`packages/games/src/memory/`): 12 simbolos posibles, 6/8/10
parejas segun dificultad, barajado determinista por semilla. El clasico mas
simple de los tres, y el mas rapido de construir. 31 tests en total entre los
tres motores.

**Practica libre vs. modo mapa.** Las partidas de practica libre (picker
dentro del propio juego) se generan y validan enteramente en el navegador:
sin ranking que proteger todavia, no hay nada que "hacer trampa" ganaria, y
esto las mantiene disponibles incluso sin conexion. Las partidas lanzadas
desde una parada del mapa usan la misma logica pero, al terminar, avisan al
servidor para desbloquear la siguiente parada (validado alli: no basta con
decir "lo he completado", el nodo tiene que estar realmente desbloqueado).

## El mapa: "El camino de Barbara"

Un camino fijo de paradas (`packages/shared/src/world-map.ts`) que hilan una
pequena historia: Barbara abre su boutique, disena su coleccion, viaja por el
mundo buscando inspiracion y cierra con la gran gala. Cada parada es una
partida con dificultad o tema ya fijados; completarla desbloquea la
siguiente. El progreso (que paradas ha completado cada usuaria) se guarda en
el servidor (`packages/server/src/modules/progress/`), pero el catalogo del
mapa en si es contenido estatico: anadir una parada nueva es anadir una
entrada a la lista, no tocar la base de datos.

## Reto diario y racha

Siempre sudoku en dificultad media, con la semilla del dia
(`dailySeed("sudoku", gameDay)`): mismo puzzle para todo el mundo, un dia
entero, sin guardarlo en ningun sitio. A diferencia de la practica libre,
esta partida **si la verifica el servidor de verdad**
(`packages/server/src/modules/daily/daily.service.ts`): regenera el mismo
puzzle a partir de la semilla y comprueba que la cuadricula enviada resuelve
exactamente eso, antes de contar el dia como jugado. Es el unico sitio donde
merecia la pena esa verificacion, porque es el unico con una racha (dias
consecutivos) que proteger.

El icono "✨ Reto diario" es fijo en la cabecera del mapa, independiente del
progreso — tal y como se penso desde el principio. Si el reto de hoy sigue
sin hacer, aparece un banner con la racha actual y un boton opcional para
activar un aviso del navegador (Web Notification API, gratis, sin servicio
externo). Nota honesta: ese aviso solo puede saltar mientras haya una
pestana de miniBarbara abierta; un aviso con la app cerrada del todo
necesitaria Web Push de verdad (service worker + claves VAPID) — tambien
gratuito, pero mas infraestructura, pendiente para una fase futura si hace
falta.

## Amigas y chat

Amistad mutua e instantanea al agregar por codigo (`packages/server/src/modules/friends/`):
compartir el codigo ES el consentimiento, no hay paso de "aceptar solicitud"
por ahora. El chat (`packages/server/src/modules/chat/`) es solo entre
amigas — el servidor lo comprueba en cada mensaje, no solo al abrir la
conversacion — y usa sondeo (polling cada 4s) en vez de WebSockets: para una
charla entre amigas la diferencia con "tiempo real" de verdad es
imperceptible, y esto evita anadir un servidor de conexiones persistentes
para una primera version.

## Ranking del reto diario

`GET /api/daily/leaderboard` compara tu tiempo de hoy con el de tus amigas
que tambien lo hayan completado (las que no, simplemente no salen en la
lista), ordenado del mas rapido al mas lento. Aparece automaticamente en la
pantalla del reto diario en cuanto lo completas.

## Retoques de esta ronda

- **Sudoku**: en cuanto una casilla se acierta (o es pista original) queda
  bloqueada — no se puede pisar por error. En cuanto un numero ya tiene sus 9
  apariciones colocadas correctamente, se apaga en el teclado numerico
  (`countCorrectPlacements` en `packages/games/src/sudoku/core.ts`).
- **Iconos, no emojis**: toda la interfaz usa `lucide-react` (SVG, MIT,
  gratis) en vez de emoji — se ven igual en cualquier sistema operativo.
- **Reto diario variado**: alterna entre sudoku y sopa de letras segun el
  dia, elegido deterministamente (`pickDailyGameId` en
  `packages/shared/src/seed.ts`) — no siempre es lo mismo, y el servidor
  verifica de verdad cualquiera de los dos tipos.
- **Avatar de cuerpo entero** en la vista grande del editor (piernas, brazos,
  torso con mas forma); los circulitos pequenos (perfil, amigas, chat) siguen
  siendo solo cabeza y hombros, que es lo que tiene sentido a ese tamano.
- **Mapa**: camino mas ancho tipo "sendero de tierra", decoracion de fondo
  (colinas/nubes en SVG) y chinchetas cuadradas con icono + numero + marca de
  completado. Es una recreacion "en el espiritu de" un tablero de juego con
  formas vectoriales propias, no una copia de ninguna imagen — no hay assets
  de terceros de por medio.

## Publicar la app fuera de tu maquina

Ver `DEPLOY.md`: guia paso a paso para Oracle Cloud "Always Free" (el unico
servidor remoto sin coste "para siempre" como promesa de politica, no de
prueba temporal), mas los archivos de configuracion ya preparados en
`deploy/` (`minibarbara.service` para systemd, `Caddyfile` para HTTPS
automatico) y `packages/server/.env.production.example`.

## Desarrollo en Windows: nota sobre `npm run dev`

`tsx watch` reinicia el servidor al guardar cambios matando el proceso
anterior. En Windows, ese proceso a veces tarda varios segundos en liberar
el puerto (Node no cierra una conexion keep-alive por si solo al recibir la
señal de apagado). El servidor absorbe esto solo: `closeAllConnections()` en
el apagado (`packages/server/src/index.ts`) fuerza el cierre inmediato de
conexiones abiertas, y si aun asi el puerto tarda en liberarse, reintenta el
`listen()` durante hasta 12 segundos antes de rendirse. Si alguna vez ves
"puerto ocupado, reintentando..." en la consola tras guardar un archivo, es
normal: el servidor se recupera solo.

## Estado

- [x] Fase 1.1 — Monorepo, tema visual, servidor y cliente conectados
- [x] Fase 1.2 — Registro e inicio de sesion
- [x] Fase 1.3 — Creacion de avatar (y ampliado: mas peinados/ropa/accesorios)
- [x] Fase 1.4 — Sudoku completo
- [x] Sopa de letras
- [x] Memorama
- [x] Fase 3 — Mapa y progresion, con hilo narrativo (10 paradas)
- [x] Reto diario variado (sudoku o sopa de letras segun el dia), racha y recordatorio
- [x] Fase 4 — Amigas, chat y ranking del reto diario
- [ ] Murdoku y cortar cuerdas (motores nuevos, mas grandes)
- [ ] Fase 5 — Casa y personalizacion avanzada
- [ ] Publicacion real en Oracle Cloud (guia lista en `DEPLOY.md`, falta crear la cuenta)
