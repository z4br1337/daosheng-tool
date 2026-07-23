import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const ADMIN_STUDENT_NO = "240153484";
export const DEFAULT_ADMIN_CLASS_NAME = "测试班级1班";
export const DEFAULT_ADMIN_PASSWORD = "123456";
export const PRESET_CLASS_NAMES = [
  "26法学1班",
  "26法学2班",
  "26行管1班",
  "26行管2班",
  "26人资1班",
  "26人资2班",
  "26社工1班",
  "26思政道法1班",
  "26哲学1班",
  "26社保1班",
] as const;

export async function ensurePresetClasses(): Promise<Array<{ id: string; name: string }>> {
  const existing = await prisma.class.findMany({ where: { name: { in: [...PRESET_CLASS_NAMES, DEFAULT_ADMIN_CLASS_NAME] } } });
  const existingNames = new Set(existing.map((c) => c.name));
  const missing = [...PRESET_CLASS_NAMES, DEFAULT_ADMIN_CLASS_NAME].filter((name) => !existingNames.has(name));
  for (const name of missing) {
    const existing = await prisma.class.findFirst({ where: { name } });
    if (!existing) {
      await prisma.class.create({ data: { name } });
    }
  }
  return prisma.class.findMany({ where: { name: { in: [...PRESET_CLASS_NAMES, DEFAULT_ADMIN_CLASS_NAME] } }, orderBy: { createdAt: "asc" }, select: { id: true, name: true } });
}

export async function ensureDefaultClass(): Promise<{ id: string; name: string }> {
  const [first] = await ensurePresetClasses();
  if (first?.name === DEFAULT_ADMIN_CLASS_NAME) return first;
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
