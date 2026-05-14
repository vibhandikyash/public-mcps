FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json tsconfig.json tsup.config.ts ./
COPY src ./src
RUN npm ci && npm run build

FROM node:20-alpine
RUN apk add --no-cache git
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
ENTRYPOINT ["node", "dist/index.js"]
