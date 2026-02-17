# ── Stage 1: Install + Build ──
FROM node:20-slim AS build
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace config and all package.json files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/spec/package.json packages/spec/
COPY packages/validator/package.json packages/validator/
COPY apps/api/package.json apps/api/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/spec packages/spec
COPY packages/validator packages/validator
COPY apps/api apps/api

# Build packages in order, generate Prisma client, build API
RUN pnpm --filter @toolindex/spec build && \
    pnpm --filter @toolindex/validator build && \
    pnpm --filter @toolindex/api run db:generate && \
    pnpm --filter @toolindex/api build

# Prune to production deps only
RUN pnpm --filter @toolindex/api deploy --prod /app/pruned

# ── Stage 2: Run ──
FROM node:20-slim AS run
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy the pruned production bundle
COPY --from=build /app/pruned/node_modules ./node_modules
COPY --from=build /app/pruned/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma

# Copy built workspace packages where node_modules expects them
COPY --from=build /app/packages/spec/dist ./node_modules/@toolindex/spec/dist
COPY --from=build /app/packages/spec/package.json ./node_modules/@toolindex/spec/package.json
COPY --from=build /app/packages/validator/dist ./node_modules/@toolindex/validator/dist
COPY --from=build /app/packages/validator/package.json ./node_modules/@toolindex/validator/package.json

# Copy Prisma generated client
COPY --from=build /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/apps/api/node_modules/@prisma ./node_modules/@prisma

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]
