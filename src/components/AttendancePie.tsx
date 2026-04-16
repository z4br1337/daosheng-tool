"use client";

import { useSyncExternalStore } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#14b8a6", "#eab308", "#94a3b8"];

function useMobileLayout() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mq = window.matchMedia("(max-width: 640px)");
      mq.addEventListener("change", onStoreChange);
      return () => mq.removeEventListener("change", onStoreChange);
    },
    () => window.matchMedia("(max-width: 640px)").matches,
    () => false,
  );
}

export function AttendancePie({ data }: { data: { name: string; value: number }[] }) {
  const mobile = useMobileLayout();

  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">暂无出勤字段数据</p>
    );
  }

  const outerRadius = mobile ? "68%" : 100;
  const cy = mobile ? "48%" : "50%";

  return (
    <div className="h-[min(22rem,55vw)] w-full min-h-[240px] sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            dataKey="value"
            data={data}
            nameKey="name"
            cx="50%"
            cy={cy}
            innerRadius={0}
            outerRadius={outerRadius}
            paddingAngle={1}
            label={!mobile}
            labelLine={!mobile}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: mobile ? 12 : 13 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
