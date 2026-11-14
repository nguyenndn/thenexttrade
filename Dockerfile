# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# 1. Install dependencies (Debian bookworm-slim ensures glibc compatibility for Prisma & Unidbg)
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2. Build Next.js standalone bundle
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public environment variables (injected by Coolify)
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_R2_PUBLIC_URL
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG NEXT_PUBLIC_DISABLE_TURNSTILE
ARG NEXT_PUBLIC_ANALYTICS_ENABLED
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID
ARG NEXT_PUBLIC_TELEGRAM_URL
ARG NEXT_PUBLIC_SYNC_SERVER_URL
ARG NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS
ARG NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS
ARG NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER
ARG NEXT_PUBLIC_ENABLE_TRADE_PLANS

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_R2_PUBLIC_URL=$NEXT_PUBLIC_R2_PUBLIC_URL
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY
ENV NEXT_PUBLIC_DISABLE_TURNSTILE=$NEXT_PUBLIC_DISABLE_TURNSTILE
ENV NEXT_PUBLIC_ANALYTICS_ENABLED=$NEXT_PUBLIC_ANALYTICS_ENABLED
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
ENV NEXT_PUBLIC_TELEGRAM_URL=$NEXT_PUBLIC_TELEGRAM_URL
ENV NEXT_PUBLIC_SYNC_SERVER_URL=$NEXT_PUBLIC_SYNC_SERVER_URL
ENV NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS=$NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS
ENV NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS=$NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS
ENV NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER=$NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER
ENV NEXT_PUBLIC_ENABLE_TRADE_PLANS=$NEXT_PUBLIC_ENABLE_TRADE_PLANS

RUN npx prisma generate && npm run build

# 3. Production runtime with OpenJDK 17 (headless) for mt5-cloud-sync Unidbg runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Copy Next.js standalone build + static assets
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy mt5-cloud-sync (contains index.js, apk/, bin/mt5-native-runner.jar, bin/metatrader5.apk, bin/lib/)
COPY --from=builder --chown=nextjs:nodejs /app/mt5-cloud-sync ./mt5-cloud-sync

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
