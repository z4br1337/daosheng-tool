"use client";

import type { HighlightSegment } from "@/lib/dossier";

function segClass(level: "high" | "medium" | "low") {
  if (level === "high") return "bg-red-200 text-red-950 font-semibold";
  if (level === "medium") return "bg-amber-200 text-amber-950 font-medium";
  return "bg-yellow-100 text-yellow-950";
}

export function HighlightedDossier({ segments }: { segments: HighlightSegment[] }) {
  return (
    <div className="whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {segments.map((s, i) =>
        s.kind === "text" ? (
          <span key={i}>{s.text}</span>
        ) : (
          <mark key={i} className={`${segClass(s.level)} rounded px-0.5`}>
            {s.text}
          </mark>
        ),
      )}
    </div>
  );
}
