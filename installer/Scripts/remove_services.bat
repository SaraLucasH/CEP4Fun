@echo off
setlocal

set "BASEDIR=%~dp0..\..\"
set "NSSM=%BASEDIR%runtime\tools\nssm.exe"


"%NSSM%" stop Cep4Fun-Web
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-Web confirm

"%NSSM%" stop Cep4Fun-N8N
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-N8N confirm

"%NSSM%" stop Cep4Fun-Siddhi
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-Siddhi confirm

"%NSSM%" stop Cep4Fun-Mongo
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-Mongo confirm

"%NSSM%" stop Cep4Fun-Compilador
timeout /t 3 /nobreak
"%NSSM%" remove Cep4Fun-Compilador confirm

timeout /t 5 /nobreak

endlocal