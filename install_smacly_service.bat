@echo off
setlocal

REM === RUTAS BASE ===
set "BASEDIR=%~dp0"
set "NSSM=%BASEDIR%tools\nssm.exe"
set "NODE=%BASEDIR%runtime\node\node.exe"
set "APPDIR=%BASEDIR%smacly-web"
set "APP_JS=%APPDIR%\server.js"

REM === LOGS ===
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"

REM === PARAR Y BORRAR SERVICIO (LIMPIO) ===
sc stop Cep4Fun-Web >nul 2>&1
sc delete Cep4Fun-Web >nul 2>&1

REM === ESPERA CORTA ===
timeout /t 2 >nul

REM === INSTALAR SERVICIO ===
"%NSSM%" install Cep4Fun-Web "%NODE%"

REM === CONFIGURACIÓN NSSM ===
"%NSSM%" set Cep4Fun-Web AppDirectory "%APPDIR%"
"%NSSM%" set Cep4Fun-Web AppParameters "\"%APP_JS%\"
"%NSSM%" set Cep4Fun-Web Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-Web AppExit Default Restart
"%NSSM%" set Cep4Fun-Web AppRestartDelay 5000
"%NSSM%" set Cep4Fun-Web AppThrottle 15000
"%NSSM%" set Cep4Fun-Web AppStdout "%BASEDIR%logs\smacly.log"
"%NSSM%" set Cep4Fun-Web AppStderr "%BASEDIR%logs\smacly-error.log"
"%NSSM%" set Cep4Fun-Web AppNoConsole 1

REM === ARRANCAR SERVICIO ===
"%NSSM%" start Cep4Fun-Web

endlocal
echo Servicio Cep4Fun-Web instalado y arrancado correctamente.