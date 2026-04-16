import type { AiIssue } from "@/lib/types";
import type { ProfileRecord } from "@prisma/client";

export function buildDossierText(
  studentName: string,
  records: Pick<
    ProfileRecord,
    | "role"
    | "reporterName"
    | "attendance"
    | "learningConfusion"
    | "learningAttitude"
    | "learningNotes"
    | "mentalState"
    | "mentalNotes"
    | "createdAt"
  >[],
): string {
  const roleLabel = (r: string) => (r === "MENTOR" ? "导生" : "班委");
  const blocks = records.map((rec, idx) => {
    const lines = [
      `记录 ${idx + 1}（${roleLabel(rec.role)} ${rec.reporterName}，${rec.createdAt.toISOString().slice(0, 10)}）`,
      rec.attendance ? `出勤：${rec.attendance}` : "",
      rec.learningConfusion ? `学习困惑：${rec.learningConfusion}` : "",
      rec.learningAttitude ? `学习态度：${rec.learningAttitude}` : "",
      rec.learningNotes ? `其他学习情况：${rec.learningNotes}` : "",
      rec.mentalState ? `心理状态：${rec.mentalState}` : "",
      rec.mentalNotes ? `心理备注：${rec.mentalNotes}` : "",
    ].filter(Boolean);
    return lines.join("\n");
  });
  return [`学生：${studentName}`, "", ...blocks].join("\n\n");
}

export type HighlightSegment =
  | { kind: "text"; text: string }
  | { kind: "risk"; text: string; level: "high" | "medium" | "low" };

export function highlightSegments(text: string, issues: AiIssue[]): HighlightSegment[] {
  if (!text) return [];
  const phrases = issues
    .map((i) => i.phrase.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  if (phrases.length === 0) return [{ kind: "text", text }];

  type Seg = { t: string; level?: "high" | "medium" | "low" };
  let segs: Seg[] = [{ t: text }];

  for (const phrase of phrases) {
    const issue = issues.find((i) => i.phrase.trim() === phrase);
    const level = issue?.level ?? "medium";
    const next: Seg[] = [];
    for (const seg of segs) {
      if (seg.level) {
        next.push(seg);
        continue;
      }
      let rest = seg.t;
      let guard = 0;
      while (guard++ < 500 && rest.includes(phrase)) {
        const idx = rest.indexOf(phrase);
        if (idx > 0) next.push({ t: rest.slice(0, idx) });
        next.push({ t: phrase, level });
        rest = rest.slice(idx + phrase.length);
      }
      if (rest) next.push({ t: rest });
    }
    segs = next;
  }

  return segs.map((s) =>
    s.level ? { kind: "risk" as const, text: s.t, level: s.level } : { kind: "text" as const, text: s.t },
  );
}
