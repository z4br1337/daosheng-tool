import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextResponse } from "next/server";

const STOP = new Set([
  "的",
  "了",
  "和",
  "与",
  "或",
  "在",
  "是",
  "有",
  "无",
  "不",
  "很",
  "较",
  "等",
  "及",
  "对",
  "为",
  "以",
  "也",
  "都",
  "就",
  "但",
  "而",
  "中",
  "上",
  "下",
  "到",
  "从",
  "把",
  "被",
  "个",
  "一",
  "学生",
  "同学",
  "课堂",
  "学习",
]);

function tokenize(text: string): string[] {
  return text
    .split(/[\s,，。；;、.!！?？'"“”‘’()\[\]{}:：\n\r\t]+/u)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !STOP.has(t));
}

export async function GET() {
  try {
    const auth = await readAuthContext();
    if (!auth.ok) return NextResponse.json({ error: "未登录" }, { status: 401 });

    const records = await prisma.profileRecord.findMany({
      where: { student: { classId: auth.classId } },
      select: {
        attendance: true,
        learningConfusion: true,
        learningAttitude: true,
        learningNotes: true,
        mentalState: true,
        mentalNotes: true,
      },
    });

    const attendanceBuckets = new Map<string, number>();
    const wordFreq = new Map<string, number>();

    for (const r of records) {
      if (r.attendance) {
        const key = r.attendance.trim().slice(0, 32) || "未填写";
        attendanceBuckets.set(key, (attendanceBuckets.get(key) ?? 0) + 1);
      }
      const blob = [
        r.learningConfusion,
        r.learningAttitude,
        r.learningNotes,
        r.mentalState,
        r.mentalNotes,
      ]
        .filter(Boolean)
        .join(" ");

      for (const w of tokenize(blob)) {
        wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
      }
    }

    const attendancePie = Array.from(attendanceBuckets.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    const wordCloud = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80)
      .map(([text, value]) => ({ text, value }));

    return NextResponse.json({
      totals: { records: records.length },
      attendancePie,
      wordCloud,
    });
  } catch (e) {
    console.error("[dashboard]", e);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
