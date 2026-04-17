import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import type { AiIssue } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, ctx: RouteContext) {
  try {
    const auth = await readAuthContext();
    if (!auth.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id } = await ctx.params;
    const student = await prisma.student.findFirst({
      where: { id, classId: auth.classId },
      select: {
        id: true,
        name: true,
        studentNo: true,
        records: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            role: true,
            reporterName: true,
            attendance: true,
            learningConfusion: true,
            learningAttitude: true,
            learningNotes: true,
            mentalState: true,
            mentalNotes: true,
            createdAt: true,
          },
        },
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { summary: true, issuesJson: true, createdAt: true },
        },
      },
    });

    if (!student) return NextResponse.json({ error: "未找到" }, { status: 404 });

    const latest = student.analyses[0];
    let issues: AiIssue[] = [];
    if (latest?.issuesJson) {
      try {
        const parsed = JSON.parse(latest.issuesJson) as unknown;
        if (Array.isArray(parsed)) {
          issues = parsed
            .map((it) => {
              const o = it as Record<string, unknown>;
              const phrase = typeof o.phrase === "string" ? o.phrase : "";
              const rawLevel = o.level;
              const level: AiIssue["level"] =
                rawLevel === "high" || rawLevel === "medium" || rawLevel === "low" ? rawLevel : "medium";
              const reason = typeof o.reason === "string" ? o.reason : "";
              return { phrase, level, reason } satisfies AiIssue;
            })
            .filter((i) => i.phrase.length > 0);
        }
      } catch {
        issues = [];
      }
    }

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        studentNo: student.studentNo,
      },
      records: student.records.map((r) => ({
        id: r.id,
        role: r.role,
        reporterName: r.reporterName,
        attendance: r.attendance,
        learningConfusion: r.learningConfusion,
        learningAttitude: r.learningAttitude,
        learningNotes: r.learningNotes,
        mentalState: r.mentalState,
        mentalNotes: r.mentalNotes,
        createdAt: r.createdAt.toISOString(),
      })),
      analysis: latest
        ? {
            summary: latest.summary,
            issues,
            createdAt: latest.createdAt.toISOString(),
          }
        : null,
    });
  } catch (e) {
    console.error("[students/detail]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
