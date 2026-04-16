"use client";

export function SimpleWordCloud({ items }: { items: { text: string; value: number }[] }) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">暂无足够文本生成词云</p>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="flex min-h-[220px] flex-wrap content-center items-center justify-center gap-3 p-4">
      {items.map((w) => {
        const scale = w.value / max;
        const size = 12 + scale * 30;
        const opacity = 0.55 + scale * 0.45;
        return (
          <span
            key={w.text}
            style={{ fontSize: `${size}px`, opacity }}
            className="font-semibold text-indigo-700 dark:text-indigo-300"
            title={`出现 ${w.value} 次`}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
}
