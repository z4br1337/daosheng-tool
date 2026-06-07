import { prisma } from "@/lib/prisma";

export const ADMIN_STUDENT_NO = "240153484";
export const DEFAULT_ADMIN_CLASS_NAME = "测试班级1班";

export async function ensureDefaultClass(): Promise<{ id: string; name: string }> {
  const existing = await prisma.class.findFirst({ where: { name: DEFAULT_ADMIN_CLASS_NAME } });
  if (existing) return { id: existing.id, name: existing.name };
  const created = await prisma.class.create({ data: { name: DEFAULT_ADMIN_CLASS_NAME } });
  return { id: created.id, name: created.name };
}

export async function ensureClassByName(name: string): Promise<{ id: string; name: string }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("班级名称不能为空");
  const existing = await prisma.class.findFirst({ where: { name: trimmed } });
  if (existing) return { id: existing.id, name: existing.name };
  const created = await prisma.class.create({ data: { name: trimmed } });
  return { id: created.id, name: created.name };
}
