FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
ARG DATABASE_URL=file:./prisma/data.db
ENV DATABASE_URL=$DATABASE_URL
COPY package.json package-lock.json* ./
COPY prisma ./prisma
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
# 使用绝对路径，避免 SQLite 在 standalone 进程内因工作目录导致无法打开库文件（Error code 14）
ENV DATABASE_URL=file:/app/prisma/data.db
RUN apk add --no-cache libc6-compat openssl
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
# 供 entrypoint 使用：持久卷若挂载在 /app/prisma 且为空，仍可用此副本执行 db push
COPY --from=builder /app/prisma/schema.prisma /app/.image-prisma/schema.prisma
COPY scripts/docker-entrypoint.sh /app/docker-entrypoint.sh
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

RUN mkdir -p /app/prisma /app/.image-prisma \
  && chmod +x /app/docker-entrypoint.sh \
  && chown -R nextjs:nodejs /app/prisma /app/.image-prisma /app/docker-entrypoint.sh

USER nextjs
EXPOSE 8080

ENTRYPOINT ["/app/docker-entrypoint.sh"]
