# miniBarbara

Minijuegos con estetica glam y rosa: avatar propio, amigas por codigo, y un
reto diario por cada minijuego (con su propia racha y ranking), mas una
seccion de practica libre para jugar sin limite a cualquier hora.

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
parejas segun dificultad, barajado determinista por semilla.

**2048** (`packages/games/src/twenty48/`): junto con el puzzle deslizante,
uno de los que tiene verificacion "de verdad" en el sentido estricto — el resultado NO es publico
de antemano (depende de que movimientos hagas), asi que el reto diario
manda el historial completo de movimientos y el servidor repite la partida
entera desde la semilla (`replayGame2048`) para confirmar la puntuacion.
Objetivo diario: llegar a la ficha 512.

**Secuencia** (`packages/games/src/simon/`, al estilo Simon): repite una
secuencia de colores que crece una posicion cada ronda. Objetivo diario: 10
rondas.

**Adivina la palabra** (`packages/games/src/wordguess/`): palabra secreta de
5 letras sacada de un catalogo cerrado (~90 palabras, sin acentos ni enes,
igual criterio que la sopa de letras), 6 intentos, cada intento se
compara letra a letra (verde = en su sitio, dorado = existe pero
descolocada) con el mismo algoritmo del juego clasico, incluida la gestion
correcta de letras repetidas. El reto diario manda el historial de
intentos; el servidor solo exige que el ultimo sea la palabra secreta y que
todos vengan del mismo catalogo cerrado.

**Buscaminas** (`packages/games/src/minesweeper/`): tablero 8x8 con 10
minas colocadas por semilla, cascada clasica al descubrir una casilla sin
ninguna mina alrededor. El reto diario manda la lista de casillas
descubiertas al ganar; el servidor regenera el mismo tablero y comprueba
que ninguna mina este entre ellas y que todo lo demas si lo este.

**Puzzle deslizante** (`packages/games/src/slidepuzzle/`, 15-puzzle
clasico): se baraja aplicando movimientos validos al azar partiendo del
tablero resuelto (nunca una permutacion al azar de las 16 casillas), lo
que garantiza que siempre tiene solucion — el 15-puzzle de verdad tiene un
problema de paridad que deja sin solucion a la mitad de las permutaciones
posibles. El reto diario manda el historial de movimientos y el servidor
lo reproduce desde la semilla (`replaySlidePuzzle`, mismo mecanismo que
2048) para confirmar que de verdad queda resuelto.

**Trivia rosa** (`packages/games/src/trivia/`): catalogo cerrado de ~40
preguntas de cultura general sin nada que caduque, 5 preguntas al azar por
dia, hace falta acertar al menos 4 de 5 para completar el reto (con
reintentos ilimitados si no llega). El servidor regenera las mismas 5
preguntas desde la semilla y recalcula la puntuacion, no se fia de la que
mande el cliente.

82 tests en total entre los nueve motores (`node --test`).

**Practica libre.** Las partidas de practica libre (`/games`, picker dentro
de cada juego) se generan y validan enteramente en el navegador: sin ranking
que proteger, no hay nada que "hacer trampa" ganaria, y esto las mantiene
disponibles incluso sin conexion. Se pueden jugar sin limite a cualquier
hora del dia, para practicar o simplemente jugar.

## Reto diario, racha e historial

A diferencia del mapa que hubo en una version anterior, aqui **los 9
minijuegos tienen cada uno su propio reto diario simultaneo**: no es "hoy
toca sudoku", es sudoku + sopa de letras + memorama + 2048 + secuencia +
adivina la palabra + buscaminas + puzzle deslizante + trivia, los 9 a la
vez, cada uno con su propia racha y su propio ranking. Misma semilla
del dia para todo el mundo (`dailySeed(gameId, gameDay)` en
`packages/shared/src/seed.ts`), calculada en UTC (`currentGameDay()`) para
que dos amigas en paises distintos compartan el mismo reto — y cambian
todos a la vez a medianoche UTC.

A diferencia de la practica libre, esta partida **si la verifica el
servidor de verdad** (`packages/server/src/modules/daily/daily.service.ts`),
cada juego con su propia comprobacion (grid de sudoku, palabras de la sopa
de letras, parejas del memorama, repetir la partida entera de 2048, la
secuencia de Simon, el ultimo intento de adivinar la palabra, el tablero
de buscaminas despejado, el puzzle deslizante resuelto tras reproducir los
movimientos, o la puntuacion del quiz) — es el unico sitio donde merecia
la pena esa verificacion, porque es el unico con una racha (dias
consecutivos) que proteger. `GET /api/daily` devuelve el estado de los 9 a
la vez; `POST /api/daily/complete` y `GET /api/daily/leaderboard` llevan un
`gameId` explicito para saber de cual de los 9 se trata.

La pantalla de inicio (`/`, `DailyHubPage`) muestra las 9 tarjetas de reto
con su icono, racha y estado, mas un banner si queda alguno sin hacer hoy,
con un boton opcional para activar un aviso del navegador (Web Notification
API, gratis, sin servicio externo). Nota honesta: ese aviso solo puede
saltar mientras haya una pestana de miniBarbara abierta; un aviso con la
app cerrada del todo necesitaria Web Push de verdad (service worker + claves
VAPID) — tambien gratuito, pero mas infraestructura, pendiente para una fase
futura si hace falta.

**Historial** (`/daily/history`, al estilo de la pagina de estadisticas de
los juegos de LinkedIn): los ultimos 14 dias, agrupados por dia, con los 9
juegos de cada uno y si se completaron y en cuanto tiempo — incluidos los
dias sin jugar, para que se note el hueco. `GET /api/daily/history` calcula
la lista completa en el servidor, anidada como `dias -> juegos`.

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

`GET /api/daily/leaderboard?gameId=...` compara tu tiempo de hoy en ESE
juego con el de tus amigas que tambien lo hayan completado hoy (las que no,
simplemente no salen en la lista), ordenado del mas rapido al mas lento.
Aparece automaticamente en la pantalla del reto en cuanto lo completas —
cada uno de los 9 juegos tiene el suyo propio, no se mezclan entre si.

## Instalable en el movil (PWA)

`packages/client/public/manifest.webmanifest` + los iconos en
`public/icons/` (generados sin dependencias, con un pequeno encoder de PNG
propio en vez de un servicio externo) hacen que "Anadir a pantalla de
inicio" desde el navegador del movil cree un icono real y abra la app a
pantalla completa, sin barra de navegador — se siente como una app
instalada, aunque siga siendo una pagina web. Esto por si solo NO publica la
app en internet: sigue haciendo falta desplegar el servidor en algun sitio
alcanzable (ver `DEPLOY.md`) para que alguien que no sea tu, en su propio
movil, pueda llegar a ella.

## Retoques de esta ronda

- **Se elimino el mapa**: el hilo narrativo y el camino de 12 paradas de
  versiones anteriores desaparecen. En su lugar, la pantalla de inicio es el
  hub de los 9 retos diarios simultaneos (ver mas arriba); la practica libre
  vive aparte en `/games`.
- **Reto diario por juego, no rotativo**: antes tocaba un solo juego cada
  dia, alternando; ahora los 9 tienen su reto a la vez, cada uno con su
  propia racha y ranking.
- **De 5 a 9 minijuegos**: "Adivina la palabra", "Buscaminas", "Puzzle
  deslizante" y "Trivia rosa" — ver la seccion de Minijuegos mas arriba
  para el detalle de cada uno.
- **Sudoku**: en cuanto una casilla se acierta (o es pista original) queda
  bloqueada — no se puede pisar por error. En cuanto un numero ya tiene sus 9
  apariciones colocadas correctamente, se apaga en el teclado numerico
  (`countCorrectPlacements` en `packages/games/src/sudoku/core.ts`).
- **Iconos, no emojis**: toda la interfaz usa `lucide-react` (SVG, MIT,
  gratis) en vez de emoji — se ven igual en cualquier sistema operativo.
- **Avatar**: solo cabeza y hombros (`variant="bust"`), en el editor y en
  todos los circulitos pequenos (perfil, amigas, chat) — sin cuerpo entero.

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
- [x] Sopa de letras, Memorama, 2048, Secuencia, Adivina la palabra, Buscaminas, Puzzle deslizante, Trivia rosa (9 minijuegos en total)
- [x] Fase 4 — Amigas, chat y ranking del reto diario
- [x] Reto diario simultaneo en los 5 juegos (uno por juego, no rotativo), cada uno con su racha, ranking, recordatorio e historial
- [x] Practica libre separada del reto diario, en `/games`
- [ ] Murdoku y cortar cuerdas (motores nuevos, mas grandes)
- [ ] Fase 5 — Casa y personalizacion avanzada
- [ ] Publicacion real en Oracle Cloud (guia lista en `DEPLOY.md`, falta crear la cuenta)
