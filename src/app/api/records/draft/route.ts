import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const draftSchema = z.object({
  studentId: z.string().min(1).optional().nullable(),
  reporterName: z.string().max(64).optional().nullable(),
  attendance: z.string().max(4000).optional().nullable(),
  learningConfusion: z.string().max(4000).optional().nullable(),
  learningAttitude: z.string().max(4000).optional().nullable(),
  learningNotes: z.string().max(4000).optional().nullable(),
  mentalState: z.string().max(4000).optional().nullable(),
  mentalNotes: z.string().max(4000).optional().nullable(),
});

export async function GET() {
  try {
    const ctx = await readAuthContext();
    if (!ctx.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const draft = await prisma.recordDraft.findUnique({
      where: { userId: ctx.userId },
      select: {
        studentId: true,
        reporterName: true,
        attendance: true,
        learningConfusion: true,
        learningAttitude: true,
        learningNotes: true,
        mentalState: true,
        mentalNotes: true,
      },
    });

    return NextResponse.json({ draft: draft ?? null });
  } catch (e) {
    console.error("[records/draft:get]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

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

    const parsed = draftSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "参数错误" }, { status: 400 });
    }

    const d = parsed.data;
    const draft = await prisma.recordDraft.upsert({
      where: { userId: ctx.userId },
      update: {
        classId: ctx.classId,
        studentId: d.studentId ?? null,
        reporterName: d.reporterName ?? "",
        attendance: d.attendance ?? "",
        learningConfusion: d.learningConfusion ?? "",
        learningAttitude: d.learningAttitude ?? "",
        learningNotes: d.learningNotes ?? "",
        mentalState: d.mentalState ?? "",
        mentalNotes: d.mentalNotes ?? "",
      },
      create: {
        userId: ctx.userId,
        classId: ctx.classId,
        studentId: d.studentId ?? null,
        reporterName: d.reporterName ?? "",
        attendance: d.attendance ?? "",
        learningConfusion: d.learningConfusion ?? "",
        learningAttitude: d.learningAttitude ?? "",
        learningNotes: d.learningNotes ?? "",
        mentalState: d.mentalState ?? "",
        mentalNotes: d.mentalNotes ?? "",
      },
      select: {
        studentId: true,
        reporterName: true,
        attendance: true,
        learningConfusion: true,
        learningAttitude: true,
        learningNotes: true,
        mentalState: true,
        mentalNotes: true,
      },
    });

    return NextResponse.json({ ok: true, draft });
  } catch (e) {
    console.error("[records/draft:post]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const ctx = await readAuthContext();
    if (!ctx.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

    await prisma.recordDraft.deleteMany({ where: { userId: ctx.userId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[records/draft:delete]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
