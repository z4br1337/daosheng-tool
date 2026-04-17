import { PrismaClient } from "@prisma/client";

/**
 * SQLite 的 `file:./...` 依赖 process.cwd()；在 Docker / PaaS 上 cwd 常与预期不一致，
 * 会触发 Error code 14: Unable to open the database file。
 * 将相对路径规范为绝对路径后再交给 Prisma。
 * （此处不用 path 模块，避免 Turbopack 将整仓误纳入 standalone 追踪。）
 */
function normalizeSqliteDatabaseUrl(): void {
  const raw = process.env.DATABASE_URL;
  if (!raw) return;
  const trimmed = raw.trim();
  if (!trimmed.toLowerCase().startsWith("file:")) return;

  let rest = trimmed.slice("file:".length);
  const q = rest.indexOf("?");
  const query = q >= 0 ? rest.slice(q) : "";
  if (q >= 0) rest = rest.slice(0, q);

  // Unix 绝对路径 /foo/bar
  if (rest.startsWith("/") && !rest.startsWith("//")) return;
  // file:///... 或 UNC
  if (rest.startsWith("//")) return;
  // Windows 盘符路径 C:/ 或 C:\
  if (/^[A-Za-z]:([/\\]|$)/.test(rest)) return;

  const relative = rest.replace(/^\.\//, "").replace(/\\/g, "/").replace(/^\//, "");
  if (!relative) return;

  const base = process.cwd().replace(/\\/g, "/").replace(/\/$/, "");
  process.env.DATABASE_URL = `file:${base}/${relative}${query}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  normalizeSqliteDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** 全环境单例，避免热重载或重复 import 时多开 SQLite 连接 */
export const prisma = globalForPrisma.prisma ?? createClient();
globalForPrisma.prisma = prisma;
