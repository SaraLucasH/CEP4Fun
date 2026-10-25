#!/bin/sh
set -e

APPS=/tmp/siddhi-apps
mkdir -p "$APPS"

for f in /opt/siddhi-app/*.siddhi; do
  sed -e 's#http://localhost:3000#http://smacly-web:3000#g' \
      -e 's#http://localhost:5678#http://n8n:5678#g' \
      -e 's#http://localhost:1080#http://0.0.0.0:1080#g' \
      "$f" > "$APPS/$(basename "$f")"
done

exec /opt/siddhi/bin/runner.sh -Dapps="$APPS"
