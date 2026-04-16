#!/bin/sh
set -eu

# 默认使用容器内绝对路径，避免 SQLite 因 cwd 不同出现 Error code 14（Unable to open the database file）。
: "${DATABASE_URL:=file:/app/prisma/data.db}"
export DATABASE_URL

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

# 镜像内保留一份 schema：若将空持久卷挂载到 /app/prisma，不会遮住此路径，db push 仍可执行。
SCHEMA="/app/.image-prisma/schema.prisma"
if [ ! -f "$SCHEMA" ]; then
  SCHEMA="/app/prisma/schema.prisma"
fi
if [ ! -f "$SCHEMA" ]; then
  echo "FATAL: Prisma schema not found (tried /app/.image-prisma and /app/prisma)" >&2
  exit 1
fi

if ! npx prisma db push --skip-generate --schema="$SCHEMA"; then
  echo "FATAL: prisma db push failed — 请检查 DATABASE_URL 目录是否可写、卷挂载是否正确" >&2
  exit 1
fi

exec node server.js
