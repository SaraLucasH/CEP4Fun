@echo off
setlocal

set "BASEDIR=%~dp0"
set "NSSM=%BASEDIR%tools\nssm.exe"
set "NODE=%BASEDIR%runtime\node\node.exe"
set "RED_HOME=%BASEDIR%runtime\node\node_modules\node-red"
set "RED_JS=%RED_HOME%\red.js"
set "USER_DIR=%BASEDIR%node-red"

REM --- Crear carpetas ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"
if not exist "%USER_DIR%" mkdir "%USER_DIR%"

REM --- Limpiar servicio previo ---
sc stop Cep4Fun-NodeRED >nul 2>&1
sc delete Cep4Fun-NodeRED >nul 2>&1
timeout /t 2 >nul

REM --- Instalar servicio ---
"%NSSM%" install Cep4Fun-NodeRED "%NODE%"

"%NSSM%" set Cep4Fun-NodeRED AppDirectory "%RED_HOME%"
"%NSSM%" set Cep4Fun-NodeRED AppParameters "\"%RED_JS%\" -u \"%USER_DIR%\""
"%NSSM%" set Cep4Fun-NodeRED AppStdout "%BASEDIR%logs\nodered.log"
"%NSSM%" set Cep4Fun-NodeRED AppStderr "%BASEDIR%logs\nodered-error.log"
"%NSSM%" set Cep4Fun-NodeRED Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-NodeRED AppExit Default Restart
"%NSSM%" set Cep4Fun-NodeRED AppRestartDelay 5000

REM --- IMPORTANTE: NO definir ObjectName ---
REM => se ejecuta como LocalSystem

"%NSSM%" start Cep4Fun-NodeRED

endlocal
exit /b 0