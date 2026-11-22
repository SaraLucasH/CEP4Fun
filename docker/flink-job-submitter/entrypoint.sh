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
  # Idempotente por job: solo se envian los que NO aparecen ya en la lista
  # (el nombre del job contiene el codigo del evento, p. ej. SYE002, o
  # "Gamification"). Asi nunca se duplican jobs aunque el cluster este en
  # plena recuperacion y el listado salga incompleto un momento.
  LIST=$("$FLINK_BIN" list -m "$JOBMANAGER" 2>/dev/null)
  if [ -n "$LIST" ]; then
    for CLASS in $JOBS; do
      KEY=$(basename "$CLASS" | sed 's/.*\.//; s/Job$//')
      if ! echo "$LIST" | grep -qi "$KEY"; then
        echo "$(date -Iseconds) Falta el job $KEY - enviando..."
        "$FLINK_BIN" run -m "$JOBMANAGER" -d -c "$CLASS" "$FLINK_APP_JAR"           || echo "$(date -Iseconds) fallo al enviar $CLASS (se reintenta en 30s)"
      fi
    done
  fi
  sleep 30
done
