import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const optionalText = z.string().max(4000).optional().nullable().transform((v) => v || null);

const bodySchema = z.object({
  studentId: z.string().min(1),
  role: z.enum(["MENTOR", "COMMITTEE"]),
  reporterName: z.string().min(1).max(64),
  attendance: optionalText,
  learningConfusion: optionalText,
  learningAttitude: optionalText,
  learningNotes: optionalText,
  mentalState: optionalText,
  mentalNotes: optionalText,
});

export async function POST(req: NextRequest) {
  try {
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

    const student = await prisma.student.findFirst({
      where: { id: parsed.data.studentId, classId: ctx.classId },
    });
    if (!student) {
      return NextResponse.json({ error: "学生不存在" }, { status: 404 });
    }

    const d = parsed.data;
    const rec = await prisma.profileRecord.create({
      data: {
        studentId: student.id,
        role: d.role,
        reporterName: d.reporterName,
        attendance: d.attendance,
        learningConfusion: d.learningConfusion,
        learningAttitude: d.learningAttitude,
        learningNotes: d.learningNotes,
        mentalState: d.mentalState,
        mentalNotes: d.mentalNotes,
      },
    });

    return NextResponse.json({ ok: true, id: rec.id });
  } catch (e) {
    console.error("[records]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
