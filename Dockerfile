FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
# postinstall 会执行 prisma generate，须提供占位 URL（generate 不连库）
ARG DATABASE_URL=file:./prisma/data.db
ENV DATABASE_URL=$DATABASE_URL
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG DATABASE_URL=file:./prisma/data.db
ENV DATABASE_URL=$DATABASE_URL
# 构建期占位，避免预渲染/子进程未继承检测变量时失败；运行环境仍须配置 ≥32 字符真实值
ARG SESSION_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ENV SESSION_SECRET=$SESSION_SECRET
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0
RUN apk add --no-cache libc6-compat openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

USER nextjs
EXPOSE 8080

CMD ["sh", "-c", "npx prisma db push --skip-generate 2>&1 || echo 'db push skipped'; node server.js"]
