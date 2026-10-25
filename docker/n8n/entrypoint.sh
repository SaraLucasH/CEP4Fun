#!/bin/sh
set -e

WORKFLOWS=/tmp/cep4fun-workflows
mkdir -p "$WORKFLOWS"

for f in /workflows-src/*.json; do
  sed -e 's#http://localhost:3000#http://smacly-web:3000#g' \
      -e 's#http://127.0.0.1:1080#http://siddhi:1080#g' \
      -e 's#http://localhost:1080#http://siddhi:1080#g' \
      "$f" > "$WORKFLOWS/$(basename "$f")"
done

n8n import:workflow --separate --input="$WORKFLOWS"

for f in "$WORKFLOWS"/*.json; do
  id=$(node -e 'process.stdout.write(String(require(process.argv[1]).id))' "$f")
  n8n publish:workflow --id="$id"
done

exec n8n start
