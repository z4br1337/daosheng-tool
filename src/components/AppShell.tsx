import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";

const baseLinks = [
  { href: "/app", label: "工作台" },
  { href: "/app/students", label: "学生名单" },
  { href: "/app/fill", label: "填写档案" },
  { href: "/app/dashboard", label: "班级可视化" },
];

export function AppShell({
  isAdmin,
  children,
}: {
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const links = isAdmin
    ? [...baseLinks, { href: "/app/admin", label: "用户管理" }]
    : baseLinks;

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white shadow-md sm:h-10 sm:w-10 sm:text-sm">
              档
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold sm:text-base">学生成长档案</p>
              <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">导生 / 班委协同记录</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <nav className="hidden flex-wrap items-center gap-0.5 lg:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="touch-manipulation rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:active:bg-slate-700"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <LogoutButton />
          </div>
        </div>
        <nav
          aria-label="主导航"
          className="mx-auto flex max-w-6xl gap-1 overflow-x-auto border-t border-slate-100 px-2 py-2 lg:hidden dark:border-slate-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="touch-manipulation shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
