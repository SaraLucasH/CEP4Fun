# node:23 era una línea "Current" sin soporte LTS, ya sin parches de seguridad.
# Fijado a 24.22.1 (línea LTS activa) por CVE-2026-111497 (Brotli RCE, CVSS 9.8).
FROM node:24.22.1-alpine

#Set working directory. Otherwise, docker creates one by default
WORKDIR /home/node/smacly

#Copia node_modules ya instalado en local (ver smacly-web/.dockerignore): evita
#que el build necesite red hacia registry.npmjs.org.
COPY --chown=node:node . .

RUN mkdir -p logs && chown -R node:node /home/node/smacly

USER node

EXPOSE 3000

CMD [ "node", "server.js" ]
