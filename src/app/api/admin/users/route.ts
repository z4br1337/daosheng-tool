import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  const ctx = await readAuthContext();
  if (!ctx.ok || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      studentNo: true,
      name: true,
      role: true,
      approved: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ users });
}

const patchSchema = z.object({
  userId: z.string().min(1),
  approved: z.boolean(),
});

export async function PATCH(req: NextRequest) {
  const ctx = await readAuthContext();
  if (!ctx.ok || ctx.role !== "ADMIN") {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体无效" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "参数错误" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!target) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  if (target.id === ctx.userId) {
    return NextResponse.json({ error: "不能修改自己的状态" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: target.id },
    data: { approved: parsed.data.approved },
  });

  return NextResponse.json({ ok: true });
}
