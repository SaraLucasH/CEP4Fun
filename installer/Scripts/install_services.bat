@echo off
setlocal

cd /d "%~dp0"

call "install_mongo_service.bat"
call "install_compilador_service.bat"
call "install_kafka_service.bat"
call "install_flink_jobmanager_service.bat"
call "install_flink_taskmanager_service.bat"
call "submit_flink_jobs.bat"
call "install_n8n_service.bat"
call "install_smacly_service.bat"

endlocal
exit /b 0