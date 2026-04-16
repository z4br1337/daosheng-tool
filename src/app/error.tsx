"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-950 px-4 text-slate-50">
      <div className="rounded-2xl border border-red-500/20 bg-red-950/30 p-8 text-center shadow-lg">
        <h2 className="mb-2 text-xl font-semibold text-red-300">页面加载出错</h2>
        <p className="mb-1 text-sm text-slate-400">
          {error.message || "服务器发生了未知错误"}
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-slate-500">
            错误代码：{error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          重试
        </button>
      </div>
    </div>
  );
}
