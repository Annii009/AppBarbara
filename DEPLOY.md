# Publicar miniBarbara (Oracle Cloud "Always Free")

Cambio de plan respecto a lo que comenté antes: dije que subiría el cliente
a GitHub Pages "en cualquier caso". Ahora que hay un servidor real de por
medio, es mejor servir **todo desde el mismo dominio** (cliente + API en la
misma maquina, por el mismo Caddy): sin eso, el navegador trata la cookie de
sesión como "de otro sitio" y hay que lidiar con configuración extra
(`SameSite=None`, cabeceras CORS más permisivas) solo para esquivar un
problema que no existe si todo vive junto. Un solo servidor, sin esa
complicación añadida.

Esta guía tiene dos partes: lo que **solo tú puedes hacer** (crear la cuenta,
usar la consola web de Oracle — necesita tu identidad, no puedo hacerlo por
ti) y lo que hacemos **en el servidor por SSH**, donde sí puedo ir contigo
paso a paso o dejarte los comandos ya preparados.

## Antes de nada: lo que vas a necesitar

- Una cuenta de Oracle Cloud. Pide una tarjeta para verificar tu identidad
  **pero no cobra nada** de la capa "Always Free" salvo que tú mismo
  cambies a una maquina de pago mas adelante. Si esto te incomoda, dimelo y
  cambiamos al self-hosting en tu propio equipo, que no pide tarjeta.
- Un dominio gratuito de [DuckDNS](https://www.duckdns.org) (por ejemplo
  `minibarbara.duckdns.org`) — 2 minutos, solo pide iniciar sesión con una
  cuenta que ya tengas (Google/GitHub/etc). O, si ya tienes un dominio
  propio, lo usamos en su lugar.

## Parte 1 — Crear el servidor (consola web de Oracle, lo haces tú)

1. Entra en [cloud.oracle.com](https://cloud.oracle.com) y crea la cuenta.
2. En el menú, ve a **Compute → Instances → Create Instance**.
3. Nombre: `minibarbara`. En **Image and shape**, pulsa "Edit" y elige:
   - Imagen: **Canonical Ubuntu** (la version LTS mas reciente).
   - Forma (shape): **VM.Standard.A1.Flex** (ARM, es la que entra en la capa
     Always Free) — ponle 2 OCPU y 12 GB de RAM si te deja, es lo maximo
     gratuito y de sobra para esto.
4. En **Add SSH keys**, elige "Generate a key pair" y **descarga la clave
   privada** (el archivo `.pem` o `.key`) — es tu unica forma de entrar por
   SSH despues, guardala bien.
5. Crea la instancia y espera a que el estado sea "Running". Anota la
   **direccion IP publica**.
6. **Paso que casi todo el mundo se salta**: Oracle tiene un firewall propio
   ademas del del sistema operativo. Ve a la instancia → pestaña
   **Subnet** → **Security Lists** → la lista por defecto → **Add Ingress
   Rules**, y anade dos reglas:
   - Puerto **80** (HTTP), origen `0.0.0.0/0`
   - Puerto **443** (HTTPS), origen `0.0.0.0/0`

   Sin esto, aunque todo lo demas este bien configurado, nadie de fuera
   podra llegar a tu servidor.

7. En DuckDNS, apunta tu subdominio a la IP publica de tu instancia (el
   panel de DuckDNS tiene un campo para la IP, es un solo clic).

## Parte 2 — Conectarte por SSH

```bash
chmod 600 la-clave-que-descargaste.key
ssh -i la-clave-que-descargaste.key ubuntu@TU_IP_PUBLICA
```

A partir de aqui, todo lo que sigue son comandos dentro de esa sesion SSH.
Cuando lleguemos aqui, dime y los repasamos juntos en tiempo real — o, si
prefieres, cópialos y pégalos tal cual, están pensados para eso.

## Parte 3 — Preparar el servidor

```bash
# Node 22 (via NodeSource) y herramientas de compilacion (las necesita
# better-sqlite3, que compila un pequeno modulo nativo la primera vez)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3 git

# Un usuario dedicado, sin privilegios de mas, solo para correr la app
sudo useradd --system --create-home --shell /usr/sbin/nologin minibarbara
```

## Parte 4 — Traer el codigo y compilarlo

```bash
sudo mkdir -p /opt/minibarbara
sudo chown ubuntu:ubuntu /opt/minibarbara
git clone <URL-de-tu-repositorio> /opt/minibarbara
cd /opt/minibarbara

npm install
npm run build          # compila el cliente a packages/client/dist

cp packages/server/.env.production.example packages/server/.env
nano packages/server/.env    # rellena CLIENT_ORIGIN y genera JWT_SECRET:
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

sudo chown -R minibarbara:minibarbara /opt/minibarbara
```

## Parte 5 — El servidor como servicio (arranca solo, se reinicia solo)

```bash
sudo cp deploy/minibarbara.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now minibarbara
sudo systemctl status minibarbara      # deberia decir "active (running)"
```

## Parte 6 — Caddy (HTTPS automatico + sirve el cliente)

```bash
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy

# Edita el dominio dentro del archivo antes de copiarlo
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

En cuanto DNS resuelva tu subdominio hacia la IP, Caddy pide el certificado
HTTPS solo — no hace falta tocar nada mas. Entra en
`https://TU-SUBDOMINIO.duckdns.org` y deberia funcionar.

## Actualizar la app mas adelante

```bash
cd /opt/minibarbara
git pull
npm install
npm run build
sudo systemctl restart minibarbara
```

## Que pasa si el bug de Windows (EADDRINUSE) aparece aqui

No aparece: esa nota del README es especifica de `tsx watch` en Windows en
desarrollo. En produccion no usamos `tsx watch` (sin reinicios automaticos
por guardar archivos), asi que esa condicion de carrera no se da.

## Coste real

Cero, mientras te quedes dentro de la capa "Always Free" (2 OCPU / 12 GB
ARM, ancho de banda de sobra para un puñado de amigas jugando). Si algun
dia lo superas, Oracle no cobra automaticamente: hay que cambiar
explicitamente a un plan de pago tu misma. Aun asi, si en unos meses quieres
que revise el uso real y confirme que sigues dentro del limite gratuito,
pidemelo.
