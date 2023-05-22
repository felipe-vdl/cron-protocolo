FROM node:alpine

WORKDIR /app

COPY package.json /app
RUN npm install

COPY .env /app
COPY prisma /app/prisma
RUN npx prisma generate

COPY . /app
RUN npm run build

CMD [ "npm", "run", "start" ]