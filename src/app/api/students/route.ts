import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const ctx = await readAuthContext();
  if (!ctx.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const students = await prisma.student.findMany({
    where: { classId: ctx.classId },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { records: true, analyses: true } },
    },
  });

  return NextResponse.json({
    students: students.map((s) => ({
      id: s.id,
      name: s.name,
      studentNo: s.studentNo,
      recordCount: s._count.records,
      analysisCount: s._count.analyses,
    })),
  });
}

const bulkSchema = z.object({
  names: z.array(z.string()).min(1),
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

  const parsed = bulkSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const cleaned = Array.from(
    new Set(
      parsed.data.names
        .map((n) => n.trim())
        .filter((n) => n.length > 0),
    ),
  );

  if (cleaned.length === 0) {
    return NextResponse.json({ error: "没有有效的姓名" }, { status: 400 });
  }

  const created = await prisma.$transaction(
    cleaned.map((name) =>
      prisma.student.create({
        data: { classId: ctx.classId, name },
      }),
    ),
  );

  return NextResponse.json({
    ok: true,
    created: created.length,
    students: created.map((s) => ({ id: s.id, name: s.name })),
  });
}
