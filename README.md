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

   

