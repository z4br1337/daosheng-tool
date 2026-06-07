import { ADMIN_STUDENT_NO, ensureClassByName } from "@/lib/bootstrap";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
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
        classId: true,
      },
    });

    const classIds = Array.from(new Set(users.map((u) => u.classId).filter((id): id is string => Boolean(id))));
    const classes = classIds.length
      ? await prisma.class.findMany({
          where: { id: { in: classIds } },
          select: { id: true, name: true },
        })
      : [];
    const classMap = new Map(classes.map((c) => [c.id, c]));

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        class: u.classId ? classMap.get(u.classId) ?? null : null,
      })),
    });
  } catch (e) {
    console.error("[admin/users/list]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

const patchSchema = z.object({
  userId: z.string().min(1),
  approved: z.boolean(),
});

const inviteSchema = z.object({
  studentNo: z.string().min(1).max(32),
  className: z.string().min(1).max(64),
});

export async function POST(req: NextRequest) {
  try {
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

    const parsed = inviteSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { studentNo: parsed.data.studentNo },
      select: { id: true, studentNo: true, approved: true },
    });
    if (!target) {
      return NextResponse.json({ error: "用户不存在，请先让对方完成注册" }, { status: 404 });
    }

    const cls = await ensureClassByName(parsed.data.className);
    const passwordHash = hashPassword("123456");

    await prisma.user.update({
      where: { id: target.id },
      data: {
        approved: true,
        classId: cls.id,
        passwordHash,
      },
    });

    return NextResponse.json({ ok: true, className: cls.name, tempPassword: "123456" });
  } catch (e) {
    console.error("[admin/users/invite]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
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
      data: {
        approved: parsed.data.approved,
        classId: target.classId ?? ctx.classId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin/users/patch]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
