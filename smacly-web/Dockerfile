FROM node:23-alpine

RUN mkdir -p /home/node/smacly/node_modules && chown -R node:node /home/node/smacly

#Set working directory. Otherwise, docker creates one by default
WORKDIR /home/node/smacly

COPY --chown=node:node package*.json ./

#Change user and install all dependencies
USER node

RUN npm install

#Copy code with the appropriate permissions to the application directory on the container
COPY --chown=node:node . .

EXPOSE 3000

CMD [ "node", "server.js" ]