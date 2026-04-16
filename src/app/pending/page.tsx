import { LogoutButton } from "@/components/LogoutButton";

export default function PendingPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-2xl dark:bg-amber-900/40">
          ⏳
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">等待审批</h1>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          你的注册申请已提交，请联系管理员（学号 240153484）审批通过后即可使用系统。
        </p>
        <LogoutButton />
      </div>
    </div>
  );
}
