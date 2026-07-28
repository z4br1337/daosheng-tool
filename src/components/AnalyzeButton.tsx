"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function AnalyzeButton({ studentId }: { studentId: string }) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  async function poll(jobId: string) {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`/api/students/${studentId}/analyze/jobs/${jobId}`);
        const data = (await res.json()) as { status?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "查询分析状态失败");
          if (timerRef.current) window.clearInterval(timerRef.current);
          setLoading(false);
          return;
        }
        setStatus(data.status === "processing" ? "AI 正在后台分析中…" : data.status === "queued" ? "分析已排队…" : "分析进行中…");
        if (data.status === "completed") {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setLoading(false);
          setStatus("分析完成，正在刷新结果…");
          router.refresh();
        }
        if (data.status === "failed") {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setLoading(false);
          setError(data.error ?? "分析失败");
        }
      } catch {
        setError("网络错误");
        if (timerRef.current) window.clearInterval(timerRef.current);
        setLoading(false);
      }
    }, 2500);
  }

  async function run() {
    setError(null);
    setStatus("正在创建后台分析任务…");
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/analyze/queue`, { method: "POST" });
      const data = (await res.json()) as { error?: string; jobId?: string; status?: string };
      if (!res.ok || !data.jobId) {
        setError(data.error ?? "分析失败");
        setLoading(false);
        return;
      }
      setStatus(data.status === "queued" ? "分析已排队，离开页面也会继续执行…" : "分析任务已启动…");
      await poll(data.jobId);
    } catch {
      setError("网络错误");
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
        {loading ? "分析已在后台执行…" : "调用豆包重新分析"}
      </button>
      {status ? <p className="text-sm text-slate-600 dark:text-slate-300">{status}</p> : null}
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        分析任务会在服务器后台持续执行，你可以切换页面或退出后再回来查看结果。需要配置 <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ARK_API_KEY</code> 和 <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">ARK_MODEL</code>。
      </p>
    </div>
  );
}
