import Link from "next/link";
import { DeleteStudentButton } from "@/components/DeleteStudentButton";
import { ImportStudentsForm } from "@/components/ImportStudentsForm";
import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";

export default async function StudentsPage() {
  const ctx = await readAuthContext();
  if (!ctx.ok) return null;

  const students = await prisma.student.findMany({
    where: { classId: ctx.classId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      studentNo: true,
      _count: { select: { records: true } },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">学生名单</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          先导入名单建立空白档案，随后在「填写档案」中补充学习与心理记录。
        </p>
      </div>

      <ImportStudentsForm />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">全部学生（{students.length}）</h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {students.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  记录 {s._count.records} 条 · 学号 {s.studentNo ?? "未填"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/app/students/${s.id}`}
                  className="touch-manipulation rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-slate-50 dark:border-slate-700 dark:text-indigo-400 dark:hover:bg-slate-800"
                >
                  查看档案
                </Link>
                <DeleteStudentButton studentId={s.id} studentName={s.name} />
              </div>
            </li>
          ))}
          {students.length === 0 ? (
            <li className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400">暂无学生，请先导入名单</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
