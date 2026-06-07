import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const ADMIN_STUDENT_NO = "240153484";
export const DEFAULT_ADMIN_CLASS_NAME = "测试班级1班";
export const DEFAULT_ADMIN_PASSWORD = "123456";

export async function ensureDefaultClass(): Promise<{ id: string; name: string }> {
  const existing = await prisma.class.findFirst({ where: { name: DEFAULT_ADMIN_CLASS_NAME } });
  if (existing) return { id: existing.id, name: existing.name };
  const created = await prisma.class.create({ data: { name: DEFAULT_ADMIN_CLASS_NAME } });
  return { id: created.id, name: created.name };
}

export async function ensureAdminAccount(): Promise<{ id: string; name: string }> {
  const cls = await ensureDefaultClass();
  const passwordHash = hashPassword(DEFAULT_ADMIN_PASSWORD);
  const admin = await prisma.user.upsert({
    where: { studentNo: ADMIN_STUDENT_NO },
    update: {
      passwordHash,
      approved: true,
      role: "ADMIN",
      classId: cls.id,
    },
    create: {
      studentNo: ADMIN_STUDENT_NO,
      name: "admin",
      passwordHash,
      role: "ADMIN",
      approved: true,
      classId: cls.id,
    },
  });
  return { id: admin.id, name: admin.name };
}

export async function ensureClassByName(name: string): Promise<{ id: string; name: string }> {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("班级名称不能为空");
  const existing = await prisma.class.findFirst({ where: { name: trimmed } });
  if (existing) return { id: existing.id, name: existing.name };
  const created = await prisma.class.create({ data: { name: trimmed } });
  return { id: created.id, name: created.name };
}
