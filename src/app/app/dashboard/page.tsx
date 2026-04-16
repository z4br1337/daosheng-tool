import { DashboardClient } from "@/components/DashboardClient";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">班级整体可视化</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">聚合全班档案，供导生 / 班委例会复盘使用。</p>
      </div>
      <DashboardClient />
    </div>
  );
}
