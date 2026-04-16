"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/analyze`, { method: "POST" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "分析失败");
        return;
      }
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="inline-flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-violet-500 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "豆包分析中…" : "调用豆包重新分析"}
      </button>
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        在服务器环境变量中配置 <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ARK_API_KEY</code>（Bearer
        令牌）与 <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ARK_MODEL</code>
        ，例如官方模型名 <span className="whitespace-nowrap">doubao-seed-2-0-lite-260215</span>。
      </p>
    </div>
  );
}
