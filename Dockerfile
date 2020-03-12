FROM node:latest

ENV CT_VAULT_CONFIG=./config/vault/firebase_vault_config.json

WORKDIR /usr/src/app
COPY package.json .
RUN npm install    
COPY . .

CMD [ "npm", "start" ]