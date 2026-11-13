@echo off
setlocal

REM ----- Configuracion de paths base --------------
set "BASEDIR=%~dp0..\..\"
set "NSSM=%BASEDIR%runtime\tools\nssm.exe"
set "JAVA_HOME=%BASEDIR%runtime\java17"
set "KAFKA_HOME=%BASEDIR%runtime\kafka"
set "KAFKA_DATA=%BASEDIR%data\kafka"
set "KAFKA_CONFIG=%KAFKA_DATA%\server.properties"
REM Fixed on purpose: only matters that it stays the same across re-formats
REM of this one, local, single-node cluster.
set "KAFKA_CLUSTER_ID=MkU3OEVBNTcwNTJENDM2Qk"

REM --- Carpetas de logs y datos ---
if not exist "%BASEDIR%logs" mkdir "%BASEDIR%logs"
if not exist "%KAFKA_DATA%" mkdir "%KAFKA_DATA%"

REM =========================================
REM DEBUG
echo ========================================
echo DEBUG: Instalando servicio Kafka
echo BASEDIR: [%BASEDIR%]
echo KAFKA_HOME: [%KAFKA_HOME%]
echo KAFKA_DATA: [%KAFKA_DATA%]
echo ========================================

REM --- server.properties (KRaft, un solo nodo broker+controller) ---
REM Se regenera siempre para que un cambio aqui se aplique en cada
REM reinstalacion, igual que el config.yaml de Flink.
(
  echo process.roles=broker,controller
  echo node.id=1
  echo controller.quorum.voters=1@localhost:9093
  echo listeners=PLAINTEXT://localhost:9092,CONTROLLER://localhost:9093
  echo advertised.listeners=PLAINTEXT://localhost:9092
  echo controller.listener.names=CONTROLLER
  echo listener.security.protocol.map=CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
  echo log.dirs=%KAFKA_DATA:\=/%/log
  echo offsets.topic.replication.factor=1
  echo transaction.state.log.replication.factor=1
  echo transaction.state.log.min.isr=1
  echo group.initial.rebalance.delay.ms=0
) > "%KAFKA_CONFIG%"

REM --- Formatear el almacenamiento KRaft solo la primera vez ---
if not exist "%KAFKA_DATA%\log\meta.properties" (
  echo Formateando almacenamiento KRaft de Kafka...
  call "%KAFKA_HOME%\bin\windows\kafka-storage.bat" format -t %KAFKA_CLUSTER_ID% -c "%KAFKA_CONFIG%" --standalone
)

REM Eliminar servicio antiguo
"%NSSM%" remove Cep4Fun-Kafka confirm >nul 2>&1

REM Instalar servicio (bin\windows\*.bat necesitan cmd.exe)
"%NSSM%" install Cep4Fun-Kafka "%SystemRoot%\System32\cmd.exe" "/c \"\"%KAFKA_HOME%\bin\windows\kafka-server-start.bat\" \"%KAFKA_CONFIG%\"\""

"%NSSM%" set Cep4Fun-Kafka AppDirectory "%KAFKA_HOME%"
"%NSSM%" set Cep4Fun-Kafka AppEnvironmentExtra "JAVA_HOME=%JAVA_HOME%"
"%NSSM%" set Cep4Fun-Kafka Start SERVICE_AUTO_START
"%NSSM%" set Cep4Fun-Kafka AppExit Default Restart
"%NSSM%" set Cep4Fun-Kafka AppRestartDelay 8000
"%NSSM%" set Cep4Fun-Kafka AppThrottle 20000
"%NSSM%" set Cep4Fun-Kafka AppStdout "%BASEDIR%logs\kafka.log"
"%NSSM%" set Cep4Fun-Kafka AppStderr "%BASEDIR%logs\kafka-error.log"
"%NSSM%" set Cep4Fun-Kafka AppNoConsole 1

REM --- Iniciar servicio ---
"%NSSM%" start Cep4Fun-Kafka

echo Servicio Cep4Fun-Kafka instalado y arrancado correctamente.
endlocal
