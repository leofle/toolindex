# ── Stage 1: Install + Build ──
FROM node:20-slim AS build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace config and all package.json files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/spec/package.json packages/spec/
COPY packages/validator/package.json packages/validator/
COPY apps/api/package.json apps/api/

# Use hoisted node_modules for Docker compatibility
RUN echo "node-linker=hoisted" > .npmrc && \
    pnpm install --frozen-lockfile

# Copy source code
COPY packages/spec packages/spec
COPY packages/validator packages/validator
COPY apps/api apps/api

# Generate Prisma client, then build all packages
RUN pnpm --filter @toolindex/api run db:generate && \
    pnpm --filter @toolindex/spec build && \
    pnpm --filter @toolindex/validator build && \
    pnpm --filter @toolindex/api build

# ── Stage 2: Run ──
FROM node:20-slim AS run
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy built API code
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma

# Copy hoisted node_modules (flat, Docker-friendly)
COPY --from=build /app/node_modules ./node_modules

# Copy built workspace packages into node_modules
COPY --from=build /app/packages/spec/dist ./node_modules/@toolindex/spec/dist
COPY --from=build /app/packages/spec/package.json ./node_modules/@toolindex/spec/package.json
COPY --from=build /app/packages/validator/dist ./node_modules/@toolindex/validator/dist
COPY --from=build /app/packages/validator/package.json ./node_modules/@toolindex/validator/package.json

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]
