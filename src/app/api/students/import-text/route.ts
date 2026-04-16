import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  text: z.string().max(100_000),
});

export async function POST(req: NextRequest) {
  const ctx = await readAuthContext();
  if (!ctx.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const names = parsed.data.text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const unique = Array.from(new Set(names));
  if (unique.length === 0) {
    return NextResponse.json({ error: "文本中没有姓名" }, { status: 400 });
  }

  const existing = await prisma.student.findMany({
    where: { classId: ctx.classId, name: { in: unique } },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((s) => s.name));
  const toCreate = unique.filter((n) => !existingNames.has(n));

  if (toCreate.length === 0) {
    return NextResponse.json({ error: "所有姓名已存在，无新增" }, { status: 409 });
  }

  const created = await prisma.$transaction(
    toCreate.map((name) =>
      prisma.student.create({
        data: { classId: ctx.classId, name },
      }),
    ),
  );

  const skipped = unique.length - toCreate.length;
  return NextResponse.json({ ok: true, created: created.length, skipped });
}
