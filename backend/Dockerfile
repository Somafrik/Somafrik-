FROM node:22-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install

COPY backend/ .
COPY BackOffice /BackOffice

EXPOSE 5000

CMD ["npm","run","dev"]
