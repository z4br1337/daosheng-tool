import { ADMIN_STUDENT_NO, ensureDefaultClass } from "@/lib/bootstrap";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  studentNo: z.string().min(1).max(32),
  name: z.string().min(1).max(64),
  password: z.string().min(6).max(128),
  className: z.string().min(1).max(64).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromRequest(req);
    const limited = rateLimit(`register:${ip}`, 10, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `注册尝试过多，请 ${limited.retryAfterSec} 秒后再试` },
        { status: 429 },
      );
    }

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ error: "请求体无效" }, { status: 400 });
    }

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数错误：学号、姓名和密码不能为空" }, { status: 400 });
    }

    const { studentNo, name, password, className } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { studentNo },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ error: "该学号已注册" }, { status: 409 });
    }

    const isAdmin = studentNo === ADMIN_STUDENT_NO;

    let classRecord: { id: string; name: string } | null = null;
    if (isAdmin) {
      classRecord = await ensureDefaultClass();
    } else {
      if (!className) {
        return NextResponse.json({ error: "请填写所在班级名称" }, { status: 400 });
      }
      classRecord = await prisma.class.findFirst({ where: { name: className.trim() } });
      if (!classRecord) {
        return NextResponse.json({ error: "班级不存在，请先新增班级" }, { status: 400 });
      }
    }

    const user = await prisma.user.create({
      data: {
        studentNo,
        name,
        passwordHash: hashPassword(password),
        role: isAdmin ? "ADMIN" : "USER",
        approved: isAdmin,
        classId: classRecord?.id ?? null,
      },
    });

    const session = await getSession();
    session.userId = user.id;
    session.classId = classRecord?.id;
    session.role = user.role;
    await session.save();

    return NextResponse.json({
      ok: true,
      needApproval: !isAdmin,
      role: isAdmin ? "ADMIN" : "USER",
      className: classRecord?.name ?? null,
      message: isAdmin ? "管理员账号创建成功" : "注册成功",
    });
  } catch (e) {
    console.error("[register]", e);
    const msg = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: `服务器错误：${msg}` }, { status: 500 });
  }
}
