@echo off
setlocal

REM ----- Configuración de paths base --------------
set "BASEDIR=%~dp0"
set "NSSM=%BASEDIR%tools\nssm.exe"
set "JAVA17=%BASEDIR%runtime\java17\bin\java.exe"
set "COMPILER_DIR=%BASEDIR%compiler"
set "COMPILER_JAR=%COMPILER_DIR%\compilador.jar"
set "SOLC_PATH=%COMPILER_DIR%\solc\compilador-solc.exe"
set "VYPER_PATH=%COMPILER_DIR%\vyper\vyper0-4-3compilador.exe"

REM --- Carpeta de logs ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio Compilador
echo BASEDIR: [%BASEDIR%]
echo JAVA17: [%JAVA17%]
echo COMPILER_JAR: [%COMPILER_JAR%]
echo SOLC_PATH: [%SOLC_PATH%]
echo VYPER_PATH: [%VYPER_PATH%]
echo ========================================

REM Firewall para Java 17 (compilador)
netsh advfirewall firewall add rule ^
  name="Cep4Fun Compilador" dir=in action=allow program="%JAVA17%" enable=yes profile=any >nul 2>&1
netsh advfirewall firewall add rule ^
  name="Cep4Fun Compilador Out" dir=out action=allow program="%JAVA17%" enable=yes profile=any >nul 2>&1

REM Eliminar servicio antiguo
"%NSSM%" remove Cep4Fun-Compilador confirm >nul 2>&1

REM Instalar servicio solo con el ejecutable; los argumentos van aparte con AppParameters
REM como una única cadena (BASEDIR contiene espacios - "Program Files" - y pasarlos
REM sueltos en la línea de "nssm install" rompe el parseo). Las rutas de solc/vyper se
REM pasan como argumentos de Spring Boot (--propiedad=valor) para no depender de
REM application.properties, que trae rutas de otra máquina, ni recompilar el jar.
"%NSSM%" install Cep4Fun-Compilador "%JAVA17%"
"%NSSM%" set Cep4Fun-Compilador AppParameters "-jar \"%COMPILER_JAR%\" --compilador.solc.ruta=\"%SOLC_PATH%\" --compilador.vyper.ruta=\"%VYPER_PATH%\""

"%NSSM%" set Cep4Fun-Compilador AppDirectory "%COMPILER_DIR%"
"%NSSM%" set Cep4Fun-Compilador Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-Compilador AppExit Default Restart
"%NSSM%" set Cep4Fun-Compilador AppRestartDelay 8000
"%NSSM%" set Cep4Fun-Compilador AppThrottle 20000
"%NSSM%" set Cep4Fun-Compilador AppStdout "%BASEDIR%logs\compilador.log"
"%NSSM%" set Cep4Fun-Compilador AppStderr "%BASEDIR%logs\compilador-error.log"
"%NSSM%" set Cep4Fun-Compilador AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-Compilador

echo Servicio Cep4Fun-Compilador instalado y arrancado correctamente.
endlocal
