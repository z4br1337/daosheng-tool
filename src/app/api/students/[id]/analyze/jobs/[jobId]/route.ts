import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string; jobId: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const auth = await readAuthContext();
    if (!auth.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const { id, jobId } = await ctx.params;
    const job = await prisma.analysisJob.findFirst({
      where: { id: jobId, studentId: id, classId: auth.classId },
      select: { status: true, error: true },
    });

    if (!job) return NextResponse.json({ error: "未找到" }, { status: 404 });
    return NextResponse.json(job);
  } catch (e) {
    console.error("[analyze/job:get]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
