@echo off
setlocal

REM ----- Configuracion de paths base --------------
set "BASEDIR=%~dp0..\..\"
set "NSSM=%BASEDIR%runtime\tools\nssm.exe"
set "JAVA=%BASEDIR%runtime\java17\bin\java.exe"
set "FLINK_HOME=%BASEDIR%runtime\flink"
REM Misma carpeta que escribe install_flink_jobmanager_service.bat - debe
REM instalarse antes de este script (ver install_services.bat).
set "FLINK_CONF_DIR=%BASEDIR%data\flink\conf"

if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio Flink TaskManager
echo BASEDIR: [%BASEDIR%]
echo FLINK_HOME: [%FLINK_HOME%]
echo FLINK_CONF_DIR: [%FLINK_CONF_DIR%]
echo ========================================

if not exist "%FLINK_CONF_DIR%\config.yaml" (
  echo WARNING: "%FLINK_CONF_DIR%\config.yaml" no existe todavia.
  echo Ejecuta install_flink_jobmanager_service.bat primero.
)

REM Eliminar servicio antiguo
"%NSSM%" remove Cep4Fun-FlinkTaskManager confirm >nul 2>&1

"%NSSM%" install Cep4Fun-FlinkTaskManager "%JAVA%"
"%NSSM%" set Cep4Fun-FlinkTaskManager AppParameters "-Xms1024m -Xmx1024m -cp \"%FLINK_HOME%\lib\*\" org.apache.flink.runtime.taskexecutor.TaskManagerRunner --configDir \"%FLINK_CONF_DIR%\""

"%NSSM%" set Cep4Fun-FlinkTaskManager AppDirectory "%FLINK_HOME%"
"%NSSM%" set Cep4Fun-FlinkTaskManager AppEnvironmentExtra "FLINK_CONF_DIR=%FLINK_CONF_DIR%"
"%NSSM%" set Cep4Fun-FlinkTaskManager Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-FlinkTaskManager AppExit Default Restart
"%NSSM%" set Cep4Fun-FlinkTaskManager AppRestartDelay 8000
"%NSSM%" set Cep4Fun-FlinkTaskManager AppThrottle 20000
"%NSSM%" set Cep4Fun-FlinkTaskManager AppStdout "%BASEDIR%logs\flink-taskmanager.log"
"%NSSM%" set Cep4Fun-FlinkTaskManager AppStderr "%BASEDIR%logs\flink-taskmanager-error.log"
"%NSSM%" set Cep4Fun-FlinkTaskManager AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-FlinkTaskManager

echo Servicio Cep4Fun-FlinkTaskManager instalado y arrancado correctamente.
endlocal
