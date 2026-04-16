import { buildDossierText } from "@/lib/dossier";
import { analyzeStudentProfile } from "@/lib/doubao";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, ctx: RouteContext) {
  const auth = await readAuthContext();
  if (!auth.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await ctx.params;
  const student = await prisma.student.findFirst({
    where: { id, classId: auth.classId },
    include: { records: { orderBy: { createdAt: "asc" } } },
  });

  if (!student) return NextResponse.json({ error: "未找到" }, { status: 404 });
  if (student.records.length === 0) {
    return NextResponse.json({ error: "暂无档案记录，无法分析" }, { status: 400 });
  }

  const dossierText = buildDossierText(student.name, student.records);

  try {
    const result = await analyzeStudentProfile({
      studentName: student.name,
      dossierText,
    });

    const saved = await prisma.aiAnalysis.create({
      data: {
        studentId: student.id,
        summary: result.summary,
        issuesJson: JSON.stringify(result.issues),
      },
    });

    return NextResponse.json({
      ok: true,
      analysis: {
        id: saved.id,
        summary: saved.summary,
        issues: result.issues,
        createdAt: saved.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "分析失败";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
