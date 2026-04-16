import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  const auth = await readAuthContext();
  if (!auth.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await ctx.params;
  const student = await prisma.student.findFirst({
    where: { id, classId: auth.classId },
  });
  if (!student) return NextResponse.json({ error: "未找到" }, { status: 404 });

  await prisma.student.delete({ where: { id: student.id } });
  return NextResponse.json({ ok: true });
}
