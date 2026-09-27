@echo off
setlocal

set "BASEDIR=%~dp0..\..\"
set "NSSM=%BASEDIR%runtime\tools\nssm.exe"
set "NODE=%BASEDIR%runtime\node\node.exe"
set "N8N_HOME=%BASEDIR%runtime\node\node_modules\n8n"
set "N8N_BIN=%N8N_HOME%\bin\n8n"
set "USER_DIR=%BASEDIR%\n8n\n8n-data"

set "WORKFLOWS_DIR=%BASEDIR%n8n"
set "N8N_ZIP=%BASEDIR%runtime\n8n-runtime.zip"
set "TAR=%SystemRoot%\System32\tar.exe"

if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"
if not exist "%USER_DIR%" mkdir "%USER_DIR%"

REM --- Unzip n8n ---
if not exist "%N8N_BIN%" (
  if exist "%N8N_ZIP%" (
    echo Extracting n8n from "%N8N_ZIP%"...
    "%TAR%" -xf "%N8N_ZIP%" -C "%BASEDIR%runtime\node\node_modules"
  ) else (
    echo WARNING: either "%N8N_BIN%" or "%N8N_ZIP%" dont exist - install n8n:
    echo   runtime\node\npm.cmd install -g n8n
  )
)


echo BASEDIR: [%BASEDIR%]
echo N8N_BIN: [%N8N_BIN%]
echo USER_DIR: [%USER_DIR%]
echo WORKFLOWS_DIR: [%WORKFLOWS_DIR%]

set "N8N_USER_FOLDER=%USER_DIR%"
if exist "%WORKFLOWS_DIR%\*.json" (
  "%NODE%" "%N8N_BIN%" import:workflow --input="%WORKFLOWS_DIR%" --separate

  REM --- Each imported workflow should be activated ---
  REM This should be executed before installing service. Otherwise, change are not applied
  for %%F in ("%WORKFLOWS_DIR%\*.json") do (
    for /f "usebackq delims=" %%I in (`"%NODE%" -e "console.log(require('%%F').id)"`) do (
      echo Activando workflow %%~nxF [%%I]...
      "%NODE%" "%N8N_BIN%" publish:workflow --id=%%I
    )
  )
)


"%NSSM%" remove Cep4Fun-N8N confirm >nul 2>&1

"%NSSM%" install Cep4Fun-N8N "%NODE%"
"%NSSM%" set Cep4Fun-N8N AppParameters "\"%N8N_BIN%\" start"

"%NSSM%" set Cep4Fun-N8N AppDirectory "%N8N_HOME%"

"%NSSM%" set Cep4Fun-N8N AppEnvironmentExtra "N8N_USER_FOLDER=%USER_DIR%"
"%NSSM%" set Cep4Fun-N8N Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-N8N AppExit Default Restart
"%NSSM%" set Cep4Fun-N8N AppRestartDelay 5000
"%NSSM%" set Cep4Fun-N8N AppThrottle 15000
"%NSSM%" set Cep4Fun-N8N AppStdout "%BASEDIR%logs\n8n.log"
"%NSSM%" set Cep4Fun-N8N AppStderr "%BASEDIR%logs\n8n-error.log"
"%NSSM%" set Cep4Fun-N8N AppNoConsole 1

"%NSSM%" start Cep4Fun-N8N

echo Servicio Cep4Fun-N8N instalado y arrancado correctamente. Panel en http://localhost:5678
endlocal
exit /b 0
