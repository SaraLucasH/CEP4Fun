@echo off
setlocal

REM ----- Configuración de paths base --------------
set "BASEDIR=%~dp0"
set "NSSM=%BASEDIR%tools\nssm.exe"
set "JAVA=%BASEDIR%runtime\java\bin\java.exe"
set "JAVA_HOME=%BASEDIR%runtime\java"
set "SIDDHI_BIN=%BASEDIR%siddhi\bin"
set "SIDDHI_APPS=%BASEDIR%siddhi-app"

REM --- Carpeta de logs ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio Siddhi
echo BASEDIR: [%BASEDIR%]
echo JAVA: [%JAVA%]
echo SIDDHI_BIN: [%SIDDHI_BIN%]
echo SIDDHI_APPS: [%SIDDHI_APPS%]
echo ========================================


REM Firewall para Java
netsh advfirewall firewall add rule ^
  name="Cep4Fun Java" dir=in action=allow program="%JAVA%" enable=yes profile=any >nul 2>&1
netsh advfirewall firewall add rule ^
  name="Cep4Fun Java Out" dir=out action=allow program="%JAVA%" enable=yes profile=any >nul 2>&1

REM Eliminar servicio antiguo
"%NSSM%" remove Cep4Fun-Siddhi confirm >nul 2>&1

REM Instalar servicio correctamente escapando comillas
"%NSSM%" install Cep4Fun-Siddhi "%SystemRoot%\System32\cmd.exe" "/k \"\"%SIDDHI_BIN%\runner.bat\" -Dapps=\"%SIDDHI_APPS%\"\""

"%NSSM%" set Cep4Fun-Siddhi AppDirectory "%SIDDHI_BIN%"
"%NSSM%" set Cep4Fun-Siddhi AppEnvironmentExtra "JAVA_HOME=%JAVA_HOME%"
"%NSSM%" set Cep4Fun-Siddhi Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-Siddhi AppExit Default Restart
"%NSSM%" set Cep4Fun-Siddhi AppRestartDelay 8000
"%NSSM%" set Cep4Fun-Siddhi AppThrottle 20000
"%NSSM%" set Cep4Fun-Siddhi AppStdout "%BASEDIR%logs\siddhi.log"
"%NSSM%" set Cep4Fun-Siddhi AppStderr "%BASEDIR%logs\siddhi-error.log"
"%NSSM%" set Cep4Fun-Siddhi AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-Siddhi

echo Servicio Cep4Fun-Siddhi instalado y arrancado correctamente.
endlocal