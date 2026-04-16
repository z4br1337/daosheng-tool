import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { HighlightedDossier } from "@/components/HighlightedDossier";
import { buildDossierText, highlightSegments } from "@/lib/dossier";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import type { AiIssue } from "@/lib/types";

type PageProps = { params: Promise<{ id: string }> };

export default async function StudentDetailPage({ params }: PageProps) {
  const auth = await readAuthContext();
  if (!auth.ok) redirect("/");

  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, classId: auth.classId },
    include: {
      records: { orderBy: { createdAt: "asc" } },
      analyses: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!student) notFound();

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

  const dossierText =
    student.records.length > 0 ? buildDossierText(student.name, student.records) : "暂无记录";
  const segments = highlightSegments(dossierText, issues);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/app/students" className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            ← 返回名单
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{student.name}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">学号：{student.studentNo ?? "未填写"}</p>
        </div>
        <AnalyzeButton studentId={student.id} />
      </div>

      {latest ? (
        <section className="rounded-3xl border border-indigo-100 bg-indigo-50/60 p-6 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <h2 className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">豆包分析摘要</h2>
          <p className="mt-3 text-sm leading-relaxed text-indigo-950 dark:text-indigo-50">{latest.summary}</p>
          {issues.length > 0 ? (
            <ul className="mt-4 space-y-2 text-sm">
              {issues.map((it, idx) => (
                <li
                  key={`${it.phrase}-${idx}`}
                  className="rounded-xl border border-red-200 bg-white/80 px-3 py-2 text-red-900 dark:border-red-900/60 dark:bg-slate-900/60 dark:text-red-100"
                >
                  <span className="font-semibold">关注点：</span>
                  {it.phrase}
                  <span className="block text-xs text-red-800/80 dark:text-red-200/80">{it.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-indigo-800/80 dark:text-indigo-200/80">模型未标记额外风险短语。</p>
          )}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          尚未生成 AI 分析。填写档案后点击「调用豆包重新分析」。
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">档案正文（标红为模型识别风险短语）</h2>
        <HighlightedDossier segments={segments} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">原始记录</h2>
        <div className="space-y-3">
          {student.records.map((r) => (
            <article
              key={r.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <header className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {r.role === "MENTOR" ? "导生" : "班委"} · {r.reporterName}
                </span>
                <span>{r.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </header>
              <dl className="mt-3 space-y-1">
                {r.attendance ? (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">出勤</dt>
                    <dd>{r.attendance}</dd>
                  </div>
                ) : null}
                {r.learningConfusion ? (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">学习困惑</dt>
                    <dd>{r.learningConfusion}</dd>
                  </div>
                ) : null}
                {r.learningAttitude ? (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">学习态度</dt>
                    <dd>{r.learningAttitude}</dd>
                  </div>
                ) : null}
                {r.learningNotes ? (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">其他学习情况</dt>
                    <dd>{r.learningNotes}</dd>
                  </div>
                ) : null}
                {r.mentalState ? (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">心理状态</dt>
                    <dd>{r.mentalState}</dd>
                  </div>
                ) : null}
                {r.mentalNotes ? (
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">心理备注</dt>
                    <dd>{r.mentalNotes}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}
          {student.records.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">暂无记录</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
