# Build context: repository root (see docker-compose.yml)
FROM node:24-alpine AS build
RUN npm install -g pnpm@12.16.1
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY server/package.json server/
RUN pnpm install --frozen-lockfile --filter @location-manager/server...
COPY packages/shared packages/shared
COPY server server
RUN pnpm --filter @location-manager/server build \
  && pnpm --filter @location-manager/server deploy --prod /out

FROM node:24-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /out/package.json ./
COPY --from=build /out/node_modules ./node_modules
COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/drizzle ./drizzle
USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
