FROM node:latest

ENV CT_VAULT_CONFIG=./config/vault/vault_config.json
ENV GOOGLE_APPLICATION_CREDENTIALS=./config/vault/googlecreds.json
ENV NODE_ENV=production

WORKDIR /usr/src/app
COPY package.json .
RUN npm install    
COPY . .

CMD [ "npm", "start" ]