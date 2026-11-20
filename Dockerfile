# Build stage: install all dependencies, compile TypeScript and run the tests
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx tsc && npm run copy

RUN npm test

# Runtime stage: production dependencies and compiled code only
FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

ARG TAG=unknown
ENV TAG=$TAG

USER node

EXPOSE 3000

CMD [ "node", "./dist/index.js" ]
