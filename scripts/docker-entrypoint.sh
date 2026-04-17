#!/bin/sh
set -eu

cd /app

# 部分平台会注入空字符串、带引号的值或非 SQLite 连接串，会导致 db push 失败
export DATABASE_URL="$(
  printf '%s' "${DATABASE_URL:-}" | tr -d '\r\n' | sed "s/^[\"']//;s/[\"']$//"
)"

if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/prisma/data.db"
fi

case "$DATABASE_URL" in
  postgresql:*|postgres:*|mysql:*|mariadb:*|mongodb:*)
    echo "WARN: DATABASE_URL 非 SQLite，与本项目 schema 不兼容，已改用 file:/app/prisma/data.db" >&2
    export DATABASE_URL="file:/app/prisma/data.db"
    ;;
esac

# 相对路径 file:./... 在容器内不可靠，统一落到镜像默认绝对路径
case "$DATABASE_URL" in
  file:/*) ;;
  file://*) ;;
  file:*)
    export DATABASE_URL="file:/app/prisma/data.db"
    ;;
  *)
    echo "WARN: DATABASE_URL 非 file: 协议，已改用 file:/app/prisma/data.db" >&2
    export DATABASE_URL="file:/app/prisma/data.db"
    ;;
esac

case "$DATABASE_URL" in
  file:*)
    db_path="${DATABASE_URL#file:}"
    db_path="${db_path%%\?*}"
    db_dir=$(dirname "$db_path")
    if [ -n "$db_dir" ]; then
      mkdir -p "$db_dir"
    fi
    ;;
esac

SCHEMA="/app/.image-prisma/schema.prisma"
if [ ! -f "$SCHEMA" ]; then
  SCHEMA="/app/prisma/schema.prisma"
fi
if [ ! -f "$SCHEMA" ]; then
  echo "FATAL: Prisma schema 未找到（已尝试 /app/.image-prisma 与 /app/prisma）" >&2
  exit 1
fi

# 使用镜像构建阶段安装的 global prisma（含 effect 等完整依赖），勿用 /app/node_modules 内残缺 CLI
if ! command -v prisma >/dev/null 2>&1; then
  echo "FATAL: 未找到全局 prisma 命令" >&2
  exit 1
fi

if ! prisma db push --skip-generate --schema="$SCHEMA"; then
  echo "FATAL: prisma db push 失败（详见上方 Prisma 输出）。请检查 DATABASE_URL 目录权限与卷挂载。" >&2
  exit 1
fi

# 数据库由 root 创建时须交给 nextjs；仅对 /app 下目录递归 chown，避免误改 /tmp 等系统目录
db_path="${DATABASE_URL#file:}"
db_path="${db_path%%\?*}"
db_dir=$(dirname "$db_path")
case "$db_dir" in
  /app/*)
    chown -R nextjs:nodejs "$db_dir" 2>/dev/null || true
    ;;
esac
[ -f "$db_path" ] && chown nextjs:nodejs "$db_path" 2>/dev/null || true

exec su-exec nextjs node server.js
