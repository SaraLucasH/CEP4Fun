@echo off
setlocal

cd /d "%~dp0"

call "install_mongo_service.bat"
call "install_compilador_service.bat"
call "install_siddhi_service.bat"
call "install_nodered_service.bat"
call "install_smacly_service.bat"

endlocal
exit /b 0