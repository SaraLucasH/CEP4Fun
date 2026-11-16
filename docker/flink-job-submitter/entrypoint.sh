#!/bin/sh
set -u

# Vigila el cluster de Flink y reenvia los 9 jobs si detecta que no hay
# ninguno corriendo. Se ejecuta en bucle (nunca termina) precisamente para
# cubrir el caso que "restart: unless-stopped" por si solo NO resuelve: los
# contenedores de jobmanager/taskmanager vuelven tras un reinicio, pero el
# cluster standalone no recuerda los jobs que tenia - viven en memoria, no
# se persisten. Con este bucle, en <=30s de cualquier reinicio (del propio
# Flink o de toda la maquina) los 9 jobs vuelven solos, sin intervencion
# manual.

FLINK_APP_JAR="/opt/flink-app/flink-app-1.0.0.jar"
FLINK_BIN="/opt/flink/bin/flink"
# Este contenedor sobreescribe el entrypoint de la imagen, asi que FLINK_PROPERTIES
# no se aplica: se indica el JobManager explicitamente con -m.
JOBMANAGER="flink-jobmanager:8081"

JOBS="com.cep4fun.flink.jobs.GamificationJob
com.cep4fun.flink.jobs.Sye002Job
com.cep4fun.flink.jobs.Sye003Job
com.cep4fun.flink.jobs.Sye004Job
com.cep4fun.flink.jobs.Ntd002Job
com.cep4fun.flink.jobs.Ntd003Job
com.cep4fun.flink.jobs.Ntd004Job
com.cep4fun.flink.jobs.Dep001Job
com.cep4fun.flink.jobs.Sce003Job"

while true; do
  if "$FLINK_BIN" list -m "$JOBMANAGER" 2>/dev/null | grep -q "(RUNNING)"; then
    : # Ya hay al menos un job corriendo - no hace falta hacer nada.
  else
    echo "$(date -Iseconds) No hay jobs corriendo - enviando los 9..."
    for CLASS in $JOBS; do
      "$FLINK_BIN" run -m "$JOBMANAGER" -d -c "$CLASS" "$FLINK_APP_JAR" \
        || echo "$(date -Iseconds) fallo al enviar $CLASS (normal mientras el cluster arranca - se reintenta en 30s)"
    done
  fi
  sleep 30
done
