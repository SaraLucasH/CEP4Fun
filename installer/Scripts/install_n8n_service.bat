@echo off
setlocal

set "BASEDIR=%~dp0..\..\"
set "NSSM=%BASEDIR%runtime\tools\nssm.exe"
set "NODE=%BASEDIR%runtime\node\node.exe"
set "N8N_HOME=%BASEDIR%runtime\node\node_modules\n8n"
set "N8N_BIN=%N8N_HOME%\bin\n8n"
set "USER_DIR=%BASEDIR%\n8n\n8n-data"

set "WORKFLOWS_DIR=%BASEDIR%n8n"

REM --- Crear carpetas ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"
if not exist "%USER_DIR%" mkdir "%USER_DIR%"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio n8n
echo BASEDIR: [%BASEDIR%]
echo N8N_BIN: [%N8N_BIN%]
echo USER_DIR: [%USER_DIR%]
echo WORKFLOWS_DIR: [%WORKFLOWS_DIR%]
echo ========================================

REM --- Importar/actualizar los workflows versionados en n8n\*.json a la base de datos de
REM     n8n (--separate = cada .json es un workflow independiente). Es un comando CLI de un
REM     solo uso, no pasa por NSSM: se ejecuta ahora mismo con el mismo N8N_USER_FOLDER que
REM     usará luego el servicio, así que actualiza la misma base de datos. Reimportar el
REM     mismo fichero actualiza el workflow existente (empareja por el "id" del JSON) en vez
REM     de duplicarlo, así que es seguro volver a ejecutar este script tras reinstalar.
REM     No activa los workflows (el JSON trae "active": false) - actívalos desde la UI.
set "N8N_USER_FOLDER=%USER_DIR%"
if exist "%WORKFLOWS_DIR%\*.json" (
  "%NODE%" "%N8N_BIN%" import:workflow --input="%WORKFLOWS_DIR%" --separate
)

REM --- Limpiar servicio previo ---
"%NSSM%" remove Cep4Fun-N8N confirm >nul 2>&1

"%NSSM%" install Cep4Fun-N8N "%NODE%"
"%NSSM%" set Cep4Fun-N8N AppParameters "\"%N8N_BIN%\" start"

"%NSSM%" set Cep4Fun-N8N AppDirectory "%N8N_HOME%"
REM N8N_USER_FOLDER: dónde guarda n8n su base de datos SQLite (workflows, credenciales, histórico)
"%NSSM%" set Cep4Fun-N8N AppEnvironmentExtra "N8N_USER_FOLDER=%USER_DIR%"
"%NSSM%" set Cep4Fun-N8N Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-N8N AppExit Default Restart
"%NSSM%" set Cep4Fun-N8N AppRestartDelay 5000
"%NSSM%" set Cep4Fun-N8N AppThrottle 15000
"%NSSM%" set Cep4Fun-N8N AppStdout "%BASEDIR%logs\n8n.log"
"%NSSM%" set Cep4Fun-N8N AppStderr "%BASEDIR%logs\n8n-error.log"
"%NSSM%" set Cep4Fun-N8N AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-N8N

echo Servicio Cep4Fun-N8N instalado y arrancado correctamente. Panel en http://localhost:5678
endlocal
exit /b 0
