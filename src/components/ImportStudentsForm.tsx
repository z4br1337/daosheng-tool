"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ImportStudentsForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/students/import-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = (await res.json()) as { error?: string; created?: number };
      if (!res.ok) {
        setMsg(data.error ?? "导入失败");
        return;
      }
      setMsg(`成功创建 ${data.created ?? 0} 名学生档案`);
      setText("");
      router.refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">批量导入名单</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">每行一个学生姓名，重复姓名会自动去重。</p>
      </div>
      <textarea
        className="min-h-[160px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/20 focus:border-indigo-500 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        placeholder={"张三\n李四\n王五"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "导入中…" : "生成空白档案"}
        </button>
        {msg ? <span className="text-sm text-slate-600 dark:text-slate-300">{msg}</span> : null}
      </div>
    </form>
  );
}
