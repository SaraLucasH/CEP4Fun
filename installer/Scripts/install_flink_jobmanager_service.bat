@echo off
setlocal

REM ----- Configuracion de paths base --------------
set "BASEDIR=%~dp0..\..\"
set "NSSM=%BASEDIR%runtime\tools\nssm.exe"
set "JAVA=%BASEDIR%runtime\java17\bin\java.exe"
set "FLINK_HOME=%BASEDIR%runtime\flink"
set "FLINK_CONF_DIR=%BASEDIR%data\flink\conf"
set "FLINK_CHECKPOINTS=%BASEDIR%data\flink\checkpoints"
set "FLINK_SAVEPOINTS=%BASEDIR%data\flink\savepoints"

REM --- Carpetas de logs y datos ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"
if not exist "%FLINK_CONF_DIR%" mkdir "%FLINK_CONF_DIR%"
if not exist "%FLINK_CHECKPOINTS%" mkdir "%FLINK_CHECKPOINTS%"
if not exist "%FLINK_SAVEPOINTS%" mkdir "%FLINK_SAVEPOINTS%"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio Flink JobManager
echo BASEDIR: [%BASEDIR%]
echo FLINK_HOME: [%FLINK_HOME%]
echo FLINK_CONF_DIR: [%FLINK_CONF_DIR%]
echo ========================================

REM --- config.yaml (Flink 2.x) ---
REM Se regenera siempre, igual que server.properties de Kafka - mismos valores
REM que docker-compose.yml (FLINK_PROPERTIES), adaptados a rutas locales.
REM Lo escribe este script (JobManager); el de TaskManager reutiliza la misma carpeta.
(
  echo jobmanager.rpc.address: localhost
  echo jobmanager.bind-host: localhost
  echo taskmanager.bind-host: localhost
  echo taskmanager.host: localhost
  echo taskmanager.numberOfTaskSlots: 12
  echo state.checkpoints.dir: file:///%FLINK_CHECKPOINTS:\=/%
  echo state.savepoints.dir: file:///%FLINK_SAVEPOINTS:\=/%
  echo rest.port: 8081
  echo rest.bind-address: localhost
  echo rest.address: localhost
) > "%FLINK_CONF_DIR%\config.yaml"

REM Eliminar servicio antiguo
"%NSSM%" remove Cep4Fun-FlinkJobManager confirm >nul 2>&1

REM Invoca el entrypoint de Flink directamente (igual que Cep4Fun-Compilador
REM invoca su jar con java), en vez de depender de bin\*.bat de la
REM distribucion de Flink - comprobar una vez descargado runtime\flink que
REM arranca bien; puede necesitar ajuste de -Xmx una vez medido el uso real.
"%NSSM%" install Cep4Fun-FlinkJobManager "%JAVA%"
"%NSSM%" set Cep4Fun-FlinkJobManager AppParameters "-Xms1024m -Xmx1024m -cp \"%FLINK_HOME%\lib\*\" org.apache.flink.runtime.entrypoint.StandaloneSessionClusterEntrypoint --configDir \"%FLINK_CONF_DIR%\""

"%NSSM%" set Cep4Fun-FlinkJobManager AppDirectory "%FLINK_HOME%"
"%NSSM%" set Cep4Fun-FlinkJobManager AppEnvironmentExtra "FLINK_CONF_DIR=%FLINK_CONF_DIR%"
"%NSSM%" set Cep4Fun-FlinkJobManager Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-FlinkJobManager AppExit Default Restart
"%NSSM%" set Cep4Fun-FlinkJobManager AppRestartDelay 8000
"%NSSM%" set Cep4Fun-FlinkJobManager AppThrottle 20000
"%NSSM%" set Cep4Fun-FlinkJobManager AppStdout "%BASEDIR%logs\flink-jobmanager.log"
"%NSSM%" set Cep4Fun-FlinkJobManager AppStderr "%BASEDIR%logs\flink-jobmanager-error.log"
"%NSSM%" set Cep4Fun-FlinkJobManager AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-FlinkJobManager

echo Servicio Cep4Fun-FlinkJobManager instalado y arrancado correctamente.
endlocal
