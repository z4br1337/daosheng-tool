import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";

export default async function AppHomePage() {
  const ctx = await readAuthContext();
  if (!ctx.ok) return null;

  const [studentCount, recordCount] = await Promise.all([
    prisma.student.count({ where: { classId: ctx.classId } }),
    prisma.profileRecord.count({ where: { student: { classId: ctx.classId } } }),
  ]);

  const cards = [
    {
      title: "学生名单",
      desc: "批量导入姓名，为每位学生建立空白档案。",
      href: "/app/students",
      accent: "from-indigo-600 to-violet-600",
    },
    {
      title: "填写档案",
      desc: "导生或班委记录学习情况与心理状态。",
      href: "/app/fill",
      accent: "from-emerald-600 to-teal-600",
    },
    {
      title: "班级可视化",
      desc: "词云与饼图查看班级整体画像。",
      href: "/app/dashboard",
      accent: "from-amber-600 to-orange-600",
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
          工作台
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">欢迎回来</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          当前班级共有 <span className="font-semibold text-slate-900 dark:text-white">{studentCount}</span>{" "}
          名学生，累计 <span className="font-semibold text-slate-900 dark:text-white">{recordCount}</span>{" "}
          条档案记录。请从下方入口继续协同维护。
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.accent} opacity-90`}
            />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{c.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{c.desc}</p>
            <span className="mt-6 inline-flex items-center text-sm font-semibold text-indigo-600 group-hover:underline dark:text-indigo-400">
              进入
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
