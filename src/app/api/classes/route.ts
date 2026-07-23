import { ensurePresetClasses, PRESET_CLASS_NAMES } from "@/lib/bootstrap";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET() {
  try {
    await readAuthContext();
    const classes = await ensurePresetClasses();
    return NextResponse.json({ classes });
  } catch (e) {
    console.error("[classes/list]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

const bodySchema = z.object({
  name: z.string().min(1).max(64),
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

    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "请输入班级名称" }, { status: 400 });
    }

    const name = parsed.data.name.trim();
    const exists = await prisma.class.findFirst({ where: { name } });
    if (exists) {
      return NextResponse.json({ error: "班级已存在" }, { status: 409 });
    }

    const created = await prisma.class.create({ data: { name } });
    return NextResponse.json({ ok: true, name: created.name, id: created.id, preset: PRESET_CLASS_NAMES.includes(name as (typeof PRESET_CLASS_NAMES)[number]) });
  } catch (e) {
    console.error("[classes/create]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
