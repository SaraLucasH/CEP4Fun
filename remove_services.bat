@echo off
setlocal

set "BASEDIR=%~dp0"
set "NSSM=%BASEDIR%tools\nssm.exe"


"%NSSM%" stop Cep4Fun-Web
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-Web confirm

"%NSSM%" stop Cep4Fun-NodeRED
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-NodeRED confirm

"%NSSM%" stop Cep4Fun-Siddhi
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-Siddhi confirm

timeout /t 5 /nobreak

endlocal