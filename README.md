# CEP4Fun: Gamificando la Creación de Smart Contracts con SmaCly mediante el procesamiento de eventos complejos
Este repositorio contiene un sistema que pretende la ampliación de una herramienta visual orientada a la creación de contratos inteligentes mediante bloques, desarrollada previamente en el ámbito universitario. La ampliación se centra en la integración de una estrategia de gamificación basada en la captura y el procesamiento de eventos generados porla interacción del usuario, empleando técnicas de Complex Event Processing (CEP). Esta propuesta no solo mejora la experiencia de aprendizaje, sino que también facilita la retroalimentación contextualizada, fomenta la exploración activa y contribuye a reducir la curva de aprendizaje asociada al desarrollo de smart conntracts. Además, permite valorar en qué medida este tipo de entornos pueden contribuir a una mayor democratización del acceso al conocimiento y a la experimentación con tecnología blockchain, abriendo la puerta a futuros desarrollos educativos más inclusivos y adaptativos.

## Estructura del Proyecto
### 1. `node-red/`

Esta carpeta contiene el archivo de configuración de flujos de **Node-RED**, que se utiliza como middleware de orquestación y comunicación entre los diferentes componentes del sistema.  
Incluye:

- `flows.json`: el archivo principal que define los nodos y la lógica de procesamiento que conecta los flujos CEP con la interfaz web y otros servicios.

### 2. `siddhi-app/`

Aquí se encuentran los flujos de **Siddhi** para procesamiento de eventos complejos (CEP).  
Estos flujos están diseñados para detectar patrones relevantes en tiempo real a partir de los datos recibidos del sistema.  
Incluye:

- Archivos `.siddhi` que definen las consultas y patrones utilizados por el motor Siddhi para generar eventos derivados o activar alertas.

### 3. `smacly-web/`

Esta carpeta contiene el código fuente original de **Smacly**, una plataforma web educativa, con las **modificaciones necesarias** para:

- Integrar el sistema de retroalimentación en tiempo real.
- Comunicar con Node-RED y recibir los eventos generados por Siddhi.
- Mostrar feedback dinámico al usuario dentro de la interfaz web.

### 4. `compiler/` (no versionado en git)

Backend Java **compilador** (Spring Boot) ya compilado. En esta carpeta se incluyen los binarios `solc` y `vyper`, necesarios para compilar los contratos Solidity/Vyper generados desde SmaclyWeb. Este backend también gestiona login, usuarios, workspaces, logs de actividad y la conversión a e3value. No se versiona en este repositorio porque son binarios generados/de terceros - se genera y se coloca siguiendo la sección [Despliegue con instalador (Windows)](#despliegue-con-instalador-windows).

### 5. `installer/`, `runtime/`

- `installer/installer.iss` es el proyecto de Inno Setup, y `installer/Scripts/*.bat` los scripts que instalan/desinstalan todo el sistema (MongoDB, compilador, Node-RED, Siddhi y smacly-web) como servicios de Windows mediante NSSM.
- `runtime/` contiene todos los runtimes portables de terceros (Java, Node, MongoDB, Siddhi, NSSM). Esta carpeta no se versiona en git debido a las limitación de espacio en este repositorio. Consultar [Despliegue con instalador (Windows)](#despliegue-con-instalador-windows).

## Instrucciones de instalación de prerrequisitos
### Instalación de NodeJs
1. Descargar el instalador desde el enlace oficial.
2. Instalamos NodeJs, disponible en https://nodejs.org/en/download. Ejecutar el instalador y seguir los pasos:
   1. Clic en **“Next”**.
   2. Aceptar los términos y condiciones de la licencia. Clic en **“Next”**.
   3. Clic en **“Next”** nuevamente para continuar con la configuración.
   4. Clic en **“Next”**.
   5. Clic en **“Next”**.
   6. Clic en **“Install”**.
   7. Una vez la instalación haya terminado, comprobamos que esta correctamente instalado mediante el siguiente comando: `node --version; npm –versión`
### Instalación de Node-RED
1. Instalamos Node-RED una vez disponemos de npm: `npm install -g --unsafe-perm node-red`

   <img width="1207" height="838" alt="image" src="https://github.com/user-attachments/assets/fd8b5665-68e6-455c-99c2-d9077d9d1663" />

3. Ejecutamos Node-Red usando como directorio el path donde se encuentra el archivo "flows.json" de nuestro proyecto: `node-red -u <path del proyecto>/node-red`
   1. Para comprobar que el despliegue se ha realizado correctamente, abrimos la siguiente ruta en un navegador: `http://localhost:1880/`
   
   <img width="962" height="518" alt="image" src="https://github.com/user-attachments/assets/a25627bf-e441-4fc7-84b5-a8885df7a244" />

      
### Instalación de Siddhi
1. Descargamos **Siddhi Runner** desde: [https://siddhi.io/en/v5.1/download/](https://siddhi.io/en/v5.1/download/)
   1. En el caso de querer debugar o visualizar el flujo de streams necesitaremos instalar Siddhi Runner del mismo sitio web.
2. Extraemos la distribución que acabamos de descargar.
3. Navegamos a la carpeta: `<RUNNER_HOME>/bin`
4. Ejecutamos el siguiente comando desde la terminal: `runner.bat -Dapps="<path-proyecto>\siddhi-app`
   
   <img width="1098" height="449" alt="image" src="https://github.com/user-attachments/assets/e8e03f51-b75d-4a51-b7e7-5903c810cde2" />

## Ejecución del proyecto
1. Me posiciono en el directorio <path-del-proyecto>/smacly-web: `cd "<path-proyecto>\SistInformacion_tfm\smacly-web"`
2. Ejecuto `npm start`

   <img width="1008" height="174" alt="image" src="https://github.com/user-attachments/assets/4257adf5-06fb-46b7-8fdd-25133d22033d" />

Desde que smacly-web integra el backend `compilador`, además necesita **MongoDB** y el propio `compilador` corriendo (ver siguiente sección) para ciertas funcionalidades clave como compilación de contratos, iniciar sesión, guardar workspaces, ver logs o convertir a e3value. Sin ellos, a pesar de arrancar el servicio, la aplicación tan solo tendra accesible la pagina de login.html.

## Despliegue con instalador (Windows)

Como alternativa al arranque manual de la sección anterior: desplegar todo (MongoDB, compilador, Node-RED, Siddhi y smacly-web) como servicios de Windows mediante [NSSM](https://nssm.cc/), empaquetados en un instalador con [Inno Setup 6](https://jrsoftware.org/isinfo.php).

### Runtimes necesarios (no versionados en git)

`runtime/` y `compiler/` están en `.gitignore` porque son binarios de terceros o generados, no código propio. Antes de generar el instalador hay que descargar los runtimes **portables** (el `.zip`, sin instalador tradicional) y colocarlos en estas rutas:

| Carpeta | Contenido | Usado por |
|---|---|---|
| `runtime/java/` | JRE 8 portable | Siddhi |
| `runtime/java17/` | JDK 17 portable | compilador (Spring Boot 4 exige Java 17+; **tiene que ser JDK, no JRE**, para poder compilar el jar con `mvnw`) |
| `runtime/node/` | Node.js portable, con Node-RED instalado dentro (`node_modules/node-red`) | Node-RED |
| `runtime/mongodb/` | MongoDB Community Server portable - solo `mongod.exe` | compilador (usuarios, workspaces, logs) |
| `runtime/siddhi/` | Distribución de Siddhi Runner (`bin/`, `conf/`, `deployment/`, `lib/`) | Siddhi |
| `runtime/tools/nssm.exe` | NSSM, gestor de servicios de Windows | Todos los servicios |

### Backend `compilador`

1. Compilar el backend Java (proyecto `compilador`, fuera de este repo) con un JDK 17+ en el `PATH`/`JAVA_HOME` (no un JRE): `mvnw clean package`.
2. Copiar `target/compilador-*.jar` a `compiler/compilador.jar`.
3. Copiar los binarios de `solc` y `vyper` a `compiler/solc/` y `compiler/vyper/`.

> Para no depender de rutas especificadas en `application.properties`: las rutas de `solc`/`vyper` se pasan como argumentos al arrancar el servicio (`install_compilador_service.bat`, propiedades `--compilador.solc.ruta=...`/`--compilador.vyper.ruta=...`), y se corresponden con las descritas en el punto 3 de esta sección.

### Instalar / desinstalar los servicios

Los scripts se encuentran en `installer/Scripts/`:
- `install_services.bat`: instala y arranca, en este orden, `Cep4Fun-Mongo`, `Cep4Fun-Compilador`, `Cep4Fun-Siddhi`, `Cep4Fun-NodeRED` y `Cep4Fun-Web`.
- `remove_services.bat`: para y desinstala todos los anteriores.

### Generar el instalador

Con Inno Setup 6 instalado, compilar `installer/installer.iss` (GUI: Build → Compile, o `ISCC.exe installer/installer.iss`). 
- El instalador copia todo a `{app}` (por defecto `C:\Program Files\CEP4Fun`), manteniendo la misma estructura que en el repositorio, y ejecuta `installer\Scripts\install_services.bat` al terminar.
- El desinstalador ejecuta `installer\Scripts\remove_services.bat`.
- `installer/Output/` (el `.exe` generado) tampoco se versiona en este repositorio.

### Primer arranque

smacly-web exige haber iniciado sesión contra `compilador` para entrar al editor. La primera vez, es necesario registrar un usuario para poder usar la herramienta. En el formulario de login se encuentra el botón para este propósito.

