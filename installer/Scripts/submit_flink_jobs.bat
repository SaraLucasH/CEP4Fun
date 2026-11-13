@echo off
setlocal enabledelayedexpansion

REM Sube los 9 jobs de Flink (capa de gamificacion + los 8 detectores) al
REM cluster standalone ya arrancado por install_flink_jobmanager_service.bat
REM / install_flink_taskmanager_service.bat. Idempotente: si ya hay jobs en
REM marcha, no vuelve a enviarlos (evita duplicados en un reinstall).
REM
REM NOTA: igual que en el despliegue Docker, un reinicio de los servicios de
REM Flink (reboot de la maquina, actualizacion...) pierde los jobs en marcha
REM - hay que volver a ejecutar este script a mano tras ello. Automatizar
REM eso (checkpointing + relanzar desde el ultimo savepoint) es trabajo
REM pendiente, igual que en Docker.

set "BASEDIR=%~dp0..\..\"
set "FLINK_HOME=%BASEDIR%runtime\flink"
set "FLINK_CONF_DIR=%BASEDIR%data\flink\conf"
set "FLINK_BIN=%FLINK_HOME%\bin\flink.bat"
set "FLINK_APP_JAR=%BASEDIR%flink-app\flink-app-1.0.0.jar"
set "REST_URL=http://localhost:8081"
set "CURL=%SystemRoot%\System32\curl.exe"

if not exist "%FLINK_APP_JAR%" (
  echo ERROR: "%FLINK_APP_JAR%" no existe. Compila flink-app con
  echo   mvn clean package
  echo y copia target\flink-app-1.0.0.jar a esa ruta.
  exit /b 1
)

echo Esperando a que el JobManager de Flink responda en %REST_URL%...
set /a ATTEMPTS=0
:WAIT_LOOP
"%CURL%" -s -o nul -f "%REST_URL%/overview"
if %ERRORLEVEL% EQU 0 goto READY
set /a ATTEMPTS+=1
if %ATTEMPTS% GEQ 30 (
  echo ERROR: el JobManager no respondio tras 60s. Revisa logs\flink-jobmanager-error.log
  exit /b 1
)
timeout /t 2 >nul
goto WAIT_LOOP

:READY
echo JobManager listo.

REM --- Evitar reenviar si ya hay algun job corriendo ---
REM Volcado a fichero en vez de pipe directo a findstr: evita tener que
REM lidiar con comillas dentro de una cadena de busqueda entre comillas
REM (cmd.exe no las trata como escape de barra invertida). findstr /c con
REM una sola palabra sin comillas evita el problema del todo.
set "OVERVIEW_TMP=%TEMP%\cep4fun-flink-overview.json"
"%CURL%" -s "%REST_URL%/jobs/overview" > "%OVERVIEW_TMP%"
findstr /c:RUNNING "%OVERVIEW_TMP%" >nul
if %ERRORLEVEL% EQU 0 (
  echo Ya hay al menos un job en marcha - no se reenvia nada.
  echo Si quieres forzar un redeploy limpio, cancela los jobs a mano primero:
  echo   "%FLINK_BIN%" list
  echo   "%FLINK_BIN%" cancel ^<jobId^>
  exit /b 0
)

echo Enviando los 9 jobs de Flink...
call :SUBMIT com.cep4fun.flink.jobs.GamificationJob
call :SUBMIT com.cep4fun.flink.jobs.Sye002Job
call :SUBMIT com.cep4fun.flink.jobs.Sye003Job
call :SUBMIT com.cep4fun.flink.jobs.Sye004Job
call :SUBMIT com.cep4fun.flink.jobs.Ntd002Job
call :SUBMIT com.cep4fun.flink.jobs.Ntd003Job
call :SUBMIT com.cep4fun.flink.jobs.Ntd004Job
call :SUBMIT com.cep4fun.flink.jobs.Dep001Job
call :SUBMIT com.cep4fun.flink.jobs.Sce003Job

echo Los 9 jobs se han enviado. Comprueba el estado en %REST_URL%
endlocal
exit /b 0

:SUBMIT
echo   - %~1
"%FLINK_BIN%" run -d -c %~1 "%FLINK_APP_JAR%"
exit /b 0
