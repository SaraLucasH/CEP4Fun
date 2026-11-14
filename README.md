# CEP4Fun: Gamificando la Creación de Smart Contracts con SmaCly mediante el procesamiento de eventos complejos
Este repositorio contiene un sistema que pretende la ampliación de una herramienta visual orientada a la creación de contratos inteligentes mediante bloques, desarrollada previamente en el ámbito universitario. La ampliación se centra en la integración de una estrategia de gamificación basada en la captura y el procesamiento de eventos generados porla interacción del usuario, empleando técnicas de Complex Event Processing (CEP). Esta propuesta no solo mejora la experiencia de aprendizaje, sino que también facilita la retroalimentación contextualizada, fomenta la exploración activa y contribuye a reducir la curva de aprendizaje asociada al desarrollo de smart conntracts. Además, permite valorar en qué medida este tipo de entornos pueden contribuir a una mayor democratización del acceso al conocimiento y a la experimentación con tecnología blockchain, abriendo la puerta a futuros desarrollos educativos más inclusivos y adaptativos.

El sistema completo son 7 servicios: **MongoDB**, el backend Java **compilador**, **Kafka** + **Apache Flink** (JobManager + TaskManager) para el CEP de gamificación, **n8n** (enrutado de eventos) y **smacly-web** (frontend). El CEP estaba hecho con **Siddhi**; se migró por completo a Flink (ver `flink-app/`) - los flujos `.siddhi` originales se conservan en el repo solo como referencia histórica, pero ningún servicio los ejecuta ya. Hay dos formas de desplegar el sistema, documentadas más abajo:
- **Docker** (recomendado): todo como contenedores Linux con `docker compose`.
- **Instalador nativo de Windows**: todo como servicios de Windows (NSSM), para quien quiera instalarlo en local sin Docker.

## Estructura del Proyecto
### 1. `smacly-web/`

Código fuente del frontend (Node.js/Express), fork de **Smacly** con las modificaciones necesarias para integrar el sistema de retroalimentación en tiempo real (eventos CEP) y hablar con el backend `compilador`.

Páginas en `smacly-web/public/`:
- `login.html` / `register.html`: acceso.
- `home.html`: pantalla de inicio tras el login, con tarjetas a las demás secciones (la de administración solo es visible para roles `PROFESSOR`/`ADMIN`).
- `index.html`: el editor Blockly. Incluye una barra de cuenta (`accountBar`, ver `smacly-web/js/accountPanel.js`) con enlaces a las páginas de gestión y el conversor a e3value (este último sin página equivalente en el original, solo existe como modal).
- `workspaces.html`, `logs.html`, `edicion_datos_usuario.html`, `gestion_usuarios.html`: páginas de gestión (workspaces, logs de actividad, perfil propio, administración de usuarios), con el mismo nombre de fichero y estructura de cabecera que las páginas equivalentes del proyecto original `compilador` (static/*.html), para que integrar cambios futuros de ese proyecto sea lo más directo posible.

> La carga masiva de usuarios por Excel (pestaña en `gestion_usuarios.html`) llama a `/api/admin/usuarios/carga-masiva`, que `server.js` todavía no reenvía al compilador (requiere multipart/form-data) - ver comentario en el propio `server.js`.

### 2. `compiler/` (no versionado en git)

Backend Java **compilador** (Spring Boot) ya compilado, más los binarios de `solc` y `vyper` necesarios para compilar los contratos Solidity/Vyper generados desde smacly-web. Gestiona login, usuarios, workspaces, logs de actividad y conversión a e3value.

No se versiona porque son binarios generados/de terceros. Hace falta colocar:

| Fichero | Para qué | Usado por |
|---|---|---|
| `compiler/compilador.jar` | El backend compilado | Ambos despliegues |
| `compiler/solc/solc-static-linux`, `compiler/vyper/vyper.0.4.3.linux` | Binarios Linux | Docker |
| `compiler/solc/*.exe`, `compiler/vyper/*.exe` | Binarios Windows | Instalador nativo |

### 3. `siddhi-app/` (histórico, ya no se ejecuta)

Flujos de **Siddhi** (CEP) que detectaban patrones en tiempo real a partir de los eventos recibidos - `.siddhi` con las consultas que generaban eventos derivados o alertas. Sustituido por completo por `flink-app/`; se conserva solo como referencia de la lógica original (varias consultas Siddhi tenían bugs de agrupación que se corrigieron al migrar, ver comentarios en `flink-app/`).

### 4. `flink-app/`

Proyecto Maven (Java 17, Flink 2.2.1) con el CEP de gamificación que sustituye a Siddhi. Dos capas, igual que tenía Siddhi:
- **Capa 1 (detectores)**: 8 jobs (`Sye002Job`, `Sye003Job`, `Sye004Job`, `Ntd002Job`, `Ntd003Job`, `Ntd004Job`, `Dep001Job`, `Sce003Job`, en `jobs/`) que calculan si una condición se cumple, igual que las apps `.siddhi` que sustituyen. Los otros 8 eventos migrados (NTD001, SYE001, PRG002/3/4, SCE002/5/6) nunca tuvieron detector propio en Siddhi - SmaCly ya envía la condición calculada, así que van directos a la capa 2.
- **Capa 2 (`GamificationJob`)**: aplica la política de puntuación anti-exploit (ver diagrama de decisión en `ScoringRuleFunction`) con un `P`/`F`/`k` propio por evento (`ScoringMagnitudes`, en `GamificationJob`), preservando la severidad relativa que tenía cada evento bajo Siddhi (p. ej. NTD002 vale más que NTD001).
- Checkpointing + savepoints configurados (`util/JobEnvironments`) para poder reiniciar un job sin reprocesar todo el histórico (`flink stop`/`flink run -s`).
- `mvn clean package` genera `target/flink-app-1.0.0.jar` (jar sombreado, con dependencias incluidas) - hace falta copiarlo a `flink-app/flink-app-1.0.0.jar` para el instalador nativo (ver tabla de componentes no versionados más abajo), igual que `compiler/compilador.jar`.

### 5. `n8n/`

Workflows de **n8n** exportados como `.json` (enrutado de eventos entre SmaCly y el CEP):

- `receive-log-event.json`: `POST /events-log` - los 8 eventos con detector propio, reenviados a `/flink-ingest/<código>` (antes iban a Siddhi).
- `event-state.json`: los 15 `POST /event-state/<código>` - de estos, los 8 sin detector propio (NTD001, SYE001, PRG002/3/4, SCE002/5/6) también se reenvían a `/flink-ingest/<código>`; los otros 7 branches (los que sí tienen detector) han quedado inactivos (nada los dispara ya) y se dejaron sin tocar.
- `/flink-ingest/<código>` es una ruta nueva en `smacly-web/server.js` que traduce el payload de SmaCly al formato de Flink y lo publica en Kafka (`cep4fun-raw-<código>` o directamente en `cep4fun-events-input`, según el evento).

> `node-red/` queda en el repositorio solo como referencia histórica: n8n lo sustituyó por completo y ningún servicio lo usa ya.

### 6. `docker/`, `docker-compose.yml`

Dockerfiles y scripts de arranque para el despliegue en contenedores Linux:
- `docker/compilador/Dockerfile`: Java 17 + los binarios Linux de `compiler/` (sin red en el build).
- `docker/n8n/entrypoint.sh`: reescribe los hosts de los workflows, los importa y publica, y arranca n8n (imagen oficial `n8nio/n8n`).
- `smacly-web/Dockerfile`: copia el `node_modules` ya instalado en local, sin `npm install` (evita depender de `registry.npmjs.org` en el build).
- `kafka` (imagen oficial `apache/kafka`) y `flink-jobmanager`/`flink-taskmanager` (imagen oficial `flink`) no necesitan Dockerfile propio - su configuración está en `docker-compose.yml` (`FLINK_PROPERTIES`, variables de Kafka en modo KRaft).
- `docker/siddhi/Dockerfile` queda en el repo sin usarse en `docker-compose.yml` - ver nota de `siddhi-app/` más arriba.

### 7. `installer/`, `runtime/`

- `installer/installer.iss`: proyecto de Inno Setup. `installer/Scripts/*.bat`: instalan/desinstalan todo el sistema (MongoDB, compilador, Kafka, Flink JobManager/TaskManager, n8n y smacly-web) como servicios de Windows mediante NSSM.
- `runtime/`: runtimes portables de terceros (Java, Node, MongoDB, Kafka, Flink, NSSM). No se versiona por limitación de espacio.

## Versiones y seguridad

| Componente | Versión | Nota |
|---|---|---|
| Node (imagen Docker de `smacly-web`) | **24.22.1** | Corrige CVE-2026-111497 (RCE crítica en el decodificador Brotli, CVSS 9.8, parche del 21/10/2026). La línea 23 anterior era "Current" sin soporte LTS. |
| n8n (Docker e instalador nativo) | **2.45.3** | Incluye las correcciones del boletín de seguridad de n8n del 14/10/2026 (15 vulnerabilidades). Node interno (Docker): 26.12.1. |
| Node (`runtime/node/node.exe`, instalador nativo) | **22.23.4** | Misma línea mayor que antes (22.x): compatible con los módulos nativos ya instalados. También corrige CVE-2026-111497. |
| Apache Kafka | **4.3.1** | Modo KRaft (sin Zookeeper), un solo nodo broker+controller. |
| Apache Flink | **2.2.1** | `flink-cep`/`flink-connector-kafka` solo tenían compatibilidad publicada hasta esta versión al escribir esto - no subir a 2.3.x sin comprobarlo antes. |
| jackson-databind (`flink-app`) | **2.18.4** | La última publicada en Maven Central en la serie 2.18.x; no cubre del todo el CVE-2026-54512 (corregido oficialmente en 2.18.8, aún no publicado ahí) pero `flink-app` no usa tipado polimórfico, así que no es explotable aquí. |

`smacly-web/package.json` tuvo una limpieza de 15 vulnerabilidades de npm (2 críticas): `express-toastr` se quedó en su versión real (`2.0.2`) pero con `lodash` forzado a `^4.17.21` vía `"overrides"` (bajarlo de versión rompía el middleware); `ejs` se quitó porque no se usaba en ningún sitio.

Si se actualiza `runtime/node/node_modules/n8n` manualmente, recuerda regenerar `runtime/n8n-runtime.zip` con `installer/Scripts/pack-n8n-runtime.bat` antes de compilar el instalador - si no, el paquete seguirá teniendo la versión antigua.

## Despliegue con Docker (recomendado)

Requiere Docker Desktop (o Docker Engine + Compose) y haber colocado `compiler/` según la tabla de arriba.

1. Copiar `.env.example` a `.env` y generar una `N8N_ENCRYPTION_KEY` (una vez; no cambiarla después, cifra las credenciales guardadas en n8n).
2. `docker compose up -d --build`
3. Abrir `http://localhost:3000` (o el dominio/IP del servidor si es un despliegue remoto) y registrar un usuario desde la página de login.

Servicios y puertos relevantes (según `docker-compose.yml` actual):
- `smacly-web`: `3000` (publicado en todas las interfaces).
- `compilador`: `127.0.0.1:8080` (solo localhost; pensado para poder correr smacly-web nativo en local mientras se desarrolla, no para acceso externo).
- `n8n`: `127.0.0.1:15678` → `5678` interno (editor de n8n, solo administración local).
- `flink-jobmanager`: `127.0.0.1:8081` (Web UI/REST de Flink, solo localhost).
- `mongo`, `kafka`, `flink-taskmanager`: solo en la red interna de Docker, sin publicar.

> Tras un `docker compose up`/reinicio de `flink-jobmanager`/`flink-taskmanager` hace falta volver a enviar los 9 jobs a mano (`flink run -d -c <Clase> flink-app-1.0.0.jar` dentro del contenedor, o restaurando desde el último savepoint con `flink run -s <path> ...`) - el cluster standalone no los recuerda solo. Es una limitación conocida, pendiente de automatizar.

## Despliegue con instalador (Windows, standalone local)

Alternativa para quien quiera instalarlo en local sin Docker: todo (MongoDB, compilador, Kafka, Flink, n8n y smacly-web) como servicios de Windows mediante [NSSM](https://nssm.cc/), empaquetado con [Inno Setup 6](https://jrsoftware.org/isinfo.php).

> **Siddhi ya no se instala en standalone** (`install_siddhi_service.bat` se dejó en `installer/Scripts/` sin usarse, por si hace falta consultar la lógica original). `runtime/java/` (JRE 8), que solo usaba Siddhi, ya no hace falta descargarla - Kafka y Flink corren sobre `runtime/java17/`, igual que compilador.

### Runtimes necesarios (no versionados en git)

`runtime/` y `compiler/` están en `.gitignore` porque son binarios de terceros o generados. Antes de generar el instalador hay que descargar los runtimes **portables** (el `.zip`, sin instalador tradicional) y colocarlos en estas rutas:

| Carpeta | Contenido | Usado por |
|---|---|---|
| `runtime/java17/` | JDK 17 portable | compilador (Spring Boot 4 exige Java 17+; **tiene que ser JDK, no JRE**, para poder compilar el jar con `mvnw`), Kafka, Flink |
| `runtime/node/` | Node.js portable (22.23.4+) | smacly-web, n8n |
| `runtime/node/node_modules/n8n/` | n8n instalado dentro del mismo Node portable | n8n |
| `runtime/mongodb/` | MongoDB Community Server portable - solo `mongod.exe` | compilador (usuarios, workspaces, logs) |
| `runtime/kafka/` | Distribución de Apache Kafka 4.3.1 (`bin/windows/`, `libs/`) | Kafka |
| `runtime/flink/` | Distribución de Apache Flink 2.2.1 (`lib/`, `bin/flink.bat`) | Flink JobManager/TaskManager |
| `runtime/tools/nssm.exe` | NSSM, gestor de servicios de Windows | Todos los servicios |

> `runtime/node/node_modules/n8n` pesa demasiado para empaquetarlo directamente con Inno Setup (supera el límite de ruta de Windows, MAX_PATH). Por eso se distribuye como `runtime/n8n-runtime.zip` (generado con `installer/Scripts/pack-n8n-runtime.bat`) y se extrae en el propio arranque del instalador.

> Los scripts de Kafka/Flink (`install_kafka_service.bat`, `install_flink_jobmanager_service.bat`, `install_flink_taskmanager_service.bat`) invocan directamente los entry points Java (`kafka-server-start.bat`, y las clases `StandaloneSessionClusterEntrypoint`/`TaskManagerRunner` de Flink) en vez de depender de scripts de orquestación de la distribución - no se han podido probar todavía contra los binarios reales descargados; revisar logs\flink-jobmanager-error.log y logs\kafka-error.log tras el primer arranque y ajustar memoria (`-Xmx`) si hace falta.

### Backend `compilador`

1. Compilar el backend Java (proyecto `compilador`, fuera de este repo) con un JDK 17+ en el `PATH`/`JAVA_HOME` (no un JRE): `mvnw clean package`.
2. Copiar `target/compilador-*.jar` a `compiler/compilador.jar`.
3. Copiar los binarios de `solc` y `vyper` a `compiler/solc/` y `compiler/vyper/`.

### CEP de gamificación `flink-app`

1. Compilar (Java 17 + Maven, puede ser con el `mvn clean package` de un contenedor Docker desechable si no quieres instalar Maven en local - ver `flink-app/pom.xml`).
2. Copiar `flink-app/target/flink-app-1.0.0.jar` a `flink-app/flink-app-1.0.0.jar` (mismo patrón que `compiler/compilador.jar`: el instalador empaqueta el jar ya compilado, no el proyecto Maven).

> Para no depender de rutas especificadas en `application.properties`: las rutas de `solc`/`vyper` se pasan como argumentos al arrancar el servicio (`install_compilador_service.bat`, propiedades `--compilador.solc.ruta=...`/`--compilador.vyper.ruta=...`), y se corresponden con las descritas en el punto 3 de esta sección.

### Instalar / desinstalar los servicios

Los scripts se encuentran en `installer/Scripts/`:
- `install_services.bat`: instala y arranca, en este orden, `Cep4Fun-Mongo`, `Cep4Fun-Compilador`, `Cep4Fun-Kafka`, `Cep4Fun-FlinkJobManager`, `Cep4Fun-FlinkTaskManager` (y a continuación, `submit_flink_jobs.bat`, que espera a que el JobManager responda y envía los 9 jobs), `Cep4Fun-N8N` y `Cep4Fun-Web`.
- `remove_services.bat`: para y desinstala todos los anteriores.
- `submit_flink_jobs.bat` también se puede volver a ejecutar a mano - hace falta tras cualquier reinicio de `Cep4Fun-FlinkJobManager`/`Cep4Fun-FlinkTaskManager` (reboot de la máquina, actualización...), ya que el cluster standalone no recuerda los jobs entre reinicios. Es idempotente: si ya hay jobs corriendo, no reenvía nada.

### Generar el instalador

Con Inno Setup 6 instalado, compilar `installer/installer.iss` (GUI: Build → Compile, o `ISCC.exe installer/installer.iss`).
- El instalador copia todo a `{app}` (por defecto `C:\Program Files\CEP4Fun`), manteniendo la misma estructura que en el repositorio, y ejecuta `installer\Scripts\install_services.bat` al terminar.
- El desinstalador ejecuta `installer\Scripts\remove_services.bat`.
- `installer/Output/` (el `.exe` generado) tampoco se versiona en este repositorio.

### Ejecución manual (sin servicios, para desarrollo)

Con MongoDB, compilador, Kafka, Flink (con los 9 jobs ya enviados) y n8n ya arrancados (o corriendo los equivalentes de Docker, publicando sus puertos en el host):

```
cd smacly-web
PORT=3000 COMPILADOR_URL=http://localhost:8080 N8N_URL=http://localhost:15678 KAFKA_BOOTSTRAP=localhost:9092 node server.js
```

Sin `compilador` corriendo, smacly-web arranca pero solo se puede acceder a `login.html`; no hay compilación de contratos, login, workspaces, logs ni conversión a e3value.

### Primer arranque

smacly-web exige haber iniciado sesión contra `compilador` para entrar al editor. La primera vez, es necesario registrar un usuario para poder usar la herramienta. En el formulario de login se encuentra el botón para este propósito.
