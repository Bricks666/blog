FROM node:lts-alpine as build

WORKDIR /app

COPY ./tsconfig.json .
COPY package*.json .
RUN npm ci --ignore-scripts

COPY ./rollup.config.js .

COPY prisma ./prisma
RUN npx prisma generate

COPY openapi.docs.json /app/
COPY src src
RUN npm run build

FROM node:lts-alpine

WORKDIR /app

COPY package*.json .
RUN npm ci --ignore-scripts --omit=dev

RUN npm i --no-save prisma
COPY prisma prisma
RUN npx prisma generate

COPY --from=build /app/dist ./

ENV PORT=5000

EXPOSE ${PORT}

CMD ["npm", "run", "start:prod"]
