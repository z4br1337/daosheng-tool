import { AuthTabs } from "@/components/AuthTabs";
import { readAuthContext } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Home() {
  const ctx = await readAuthContext();
  if (ctx.ok) redirect("/app");

  return (
    <div className="relative flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden bg-slate-950 text-slate-50">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#4f46e5_0%,_transparent_55%),radial-gradient(circle_at_bottom,_#7c3aed_0%,_transparent_50%)] opacity-70" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-4 py-10 sm:py-14 lg:flex-row lg:items-stretch lg:gap-16 lg:py-16">
        <section className="flex flex-1 flex-col justify-center space-y-5 sm:space-y-6">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl">
            学生个人情况
            <span className="mt-1 block text-indigo-200">数据可视化工具</span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            记录学习与心理状态、调用豆包大模型识别风险并标红，以词云与饼图呈现班级整体趋势。
          </p>
        </section>
        <section className="w-full shrink-0 rounded-3xl border border-white/10 bg-white/95 p-6 text-slate-900 shadow-2xl shadow-indigo-900/40 backdrop-blur sm:p-8 lg:max-w-md dark:bg-slate-900/90 dark:text-slate-50">
          <AuthTabs />
        </section>
      </div>
    </div>
  );
}
