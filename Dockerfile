FROM node:lts-alpine as build

WORKDIR /app

COPY ./tsconfig.json .
COPY package*.json .
RUN npm ci --ignore-scripts

COPY ./rollup.config.js .

COPY prisma .
RUN npx prisma generate

COPY src src
RUN npm run build

FROM node:lts-alpine

WORKDIR /app

COPY package*.json .
RUN npm ci --ignore-scripts --omit=dev

RUN npm i --no-save prisma
COPY prisma .

COPY --from=build /app/dist/* .

ENV PORT=5000

CMD ["npm", "run", "start:prod"]
