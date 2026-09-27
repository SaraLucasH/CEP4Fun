@echo off
setlocal

REM Add runtime\node\node_modules\n8n inside one unique .zip, in order to avoid  Windows MAX_PATH.
REM Uzip using tar, which does not have this limitation and it can use long paths
REM Execute this script if n8n is changed/updated before compiling again installer.iss.

set "BASEDIR=%~dp0..\..\"
set "N8N_DIR=%BASEDIR%runtime\node\node_modules\n8n"
set "ZIP_PATH=%BASEDIR%runtime\n8n-runtime.zip"
set "TAR=%SystemRoot%\System32\tar.exe"

if not exist "%N8N_DIR%" (
  echo ERROR: "%N8N_DIR%" does not exist - install n8n first using:
  echo   runtime\node\npm.cmd install -g n8n
  exit /b 1
)

if exist "%ZIP_PATH%" del /q "%ZIP_PATH%"

echo "%N8N_DIR%" in "%ZIP_PATH%"...
"%TAR%" -a -c -f "%ZIP_PATH%" -C "%BASEDIR%runtime\node\node_modules" n8n
if errorlevel 1 (
  echo ERROR: issue detected zipping n8n.
  exit /b 1
)

echo OK: %ZIP_PATH%
endlocal
exit /b 0
