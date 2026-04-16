import { prisma } from "@/lib/prisma";

export async function ensureDefaultClass(): Promise<{ id: string; name: string }> {
  const existing = await prisma.class.findFirst({ orderBy: { createdAt: "asc" } });
  if (existing) return { id: existing.id, name: existing.name };
  const created = await prisma.class.create({ data: { name: "默认班级" } });
  return { id: created.id, name: created.name };
}

/** 管理员学号——注册时自动授予 ADMIN 角色并标记已审批 */
export const ADMIN_STUDENT_NO = "240153484";
