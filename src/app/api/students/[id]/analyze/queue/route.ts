import { buildDossierText } from "@/lib/dossier";
import { analyzeStudentProfile } from "@/lib/doubao";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

async function processAnalysisJob(jobId: string) {
  const job = await prisma.analysisJob.findUnique({
    where: { id: jobId },
    include: {
      student: {
        include: { records: { orderBy: { createdAt: "asc" } } },
      },
    },
  });
  if (!job || job.status !== "queued") return;
  if (!job.student || job.student.records.length === 0) {
    await prisma.analysisJob.update({ where: { id: jobId }, data: { status: "failed", error: "暂无档案记录，无法分析" } });
    return;
  }

  try {
    await prisma.analysisJob.update({ where: { id: jobId }, data: { status: "processing", error: null } });
    const dossierText = buildDossierText(job.student.name, job.student.records);
    const result = await analyzeStudentProfile({ studentName: job.student.name, dossierText });
    await prisma.aiAnalysis.create({
      data: {
        studentId: job.student.id,
        summary: result.summary,
        issuesJson: JSON.stringify(result.issues),
      },
    });
    await prisma.analysisJob.update({ where: { id: jobId }, data: { status: "completed", resultSummary: result.summary, resultIssuesJson: JSON.stringify(result.issues) } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "分析失败";
    await prisma.analysisJob.update({ where: { id: jobId }, data: { status: "failed", error: message.slice(0, 500) } });
  }
}

export async function POST(_req: Request, ctx: RouteContext) {
  const auth = await readAuthContext();
  if (!auth.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { id } = await ctx.params;
  const student = await prisma.student.findFirst({ where: { id, classId: auth.classId }, select: { id: true } });
  if (!student) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const job = await prisma.analysisJob.create({ data: { studentId: student.id, classId: auth.classId, requestedBy: auth.userId, status: "queued" } });
  void processAnalysisJob(job.id);

  return NextResponse.json({ ok: true, jobId: job.id, status: job.status });
}
