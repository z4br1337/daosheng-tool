import { ensureDefaultClass } from "@/lib/bootstrap";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { clientIpFromRequest, rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  studentNo: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const ip = clientIpFromRequest(req);
    const limited = rateLimit(`login:${ip}`, 30, 5 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `请求过于频繁，请 ${limited.retryAfterSec} 秒后再试` },
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
      return NextResponse.json({ error: "请填写学号和密码" }, { status: 400 });
    }

    const { studentNo, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { studentNo },
      select: {
        id: true,
        passwordHash: true,
        approved: true,
        role: true,
        name: true,
      },
    });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json({ error: "学号或密码错误" }, { status: 401 });
    }

    if (!user.approved) {
      return NextResponse.json({ error: "账号尚未通过管理员审批，请联系管理员" }, { status: 403 });
    }

    const cls = await ensureDefaultClass();
    const session = await getSession();
    session.userId = user.id;
    session.classId = cls.id;
    session.role = user.role;
    await session.save();

    return NextResponse.json({ ok: true, role: user.role, name: user.name });
  } catch (e) {
    console.error("[login]", e);
    const msg = e instanceof Error ? e.message : "未知错误";
    return NextResponse.json({ error: `服务器错误：${msg}` }, { status: 500 });
  }
}
