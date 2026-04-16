"use client";

import { useEffect, useState } from "react";
import { AttendancePie } from "@/components/AttendancePie";
import { SimpleWordCloud } from "@/components/SimpleWordCloud";

type DashboardPayload = {
  totals: { records: number };
  attendancePie: { name: string; value: number }[];
  wordCloud: { text: string; value: number }[];
};

export function DashboardClient() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        setError("加载失败");
        return;
      }
      setData((await res.json()) as DashboardPayload);
    })();
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!data) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">样本量</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{data.totals.records}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">条档案记录参与统计</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">出勤情况分布（饼图）</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">基于「课堂出勤」字段的原始文本归类。</p>
          <AttendancePie data={data.attendancePie} />
        </section>
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">关键词词云</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">从学习困惑、态度、心理等文本中抽取高频词。</p>
          <SimpleWordCloud items={data.wordCloud} />
        </section>
      </div>
    </div>
  );
}
