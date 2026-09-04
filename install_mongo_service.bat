@echo off
setlocal

REM ----- Configuración de paths base --------------
set "BASEDIR=%~dp0"
set "NSSM=%BASEDIR%tools\nssm.exe"
set "MONGOPATH=%BASEDIR%runtime\mongodb\mongod.exe"
set "MONGODATAPATH=%BASEDIR%data\mongodb"

REM --- Carpeta de logs ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"

REM --- Carpeta de datos ---
if not exist "%MONGODATAPATH%" mkdir "%MONGODATAPATH%"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio MongoDB
echo BASEDIR: [%BASEDIR%]
echo MongDbPath: [%MONGOPATH%]
echo MongDb Data Path: [%MONGODATAPATH%]
echo ========================================

REM Eliminar servicio antiguo
"%NSSM%" remove Cep4Fun-Mongo confirm >nul 2>&1

REM Instalar servicio solo con el ejecutable; los argumentos van aparte con AppParameters
REM como una única cadena, porque BASEDIR contiene espacios ("Program Files") y pasarlos
REM sueltos en la línea de "nssm install" rompe el parseo (nssm install lo intenta como
REM varios argumentos posicionales, "Files\..." se interpreta como un argumento suelto)
"%NSSM%" install Cep4Fun-Mongo "%MONGOPATH%"
"%NSSM%" set Cep4Fun-Mongo AppParameters "--dbpath \"%MONGODATAPATH%\" --port 27017"

"%NSSM%" set Cep4Fun-Mongo Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-Mongo AppExit Default Restart
"%NSSM%" set Cep4Fun-Mongo AppRestartDelay 8000
"%NSSM%" set Cep4Fun-Mongo AppThrottle 20000
"%NSSM%" set Cep4Fun-Mongo AppStdout "%BASEDIR%logs\mongodb.log"
"%NSSM%" set Cep4Fun-Mongo AppStderr "%BASEDIR%logs\mongodb-error.log"
"%NSSM%" set Cep4Fun-Mongo AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-Mongo

echo Servicio Cep4Fun-Mongo instalado y arrancado correctamente.
endlocal