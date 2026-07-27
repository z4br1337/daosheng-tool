import { AdminUserList } from "@/components/AdminUserList";
import { readAuthContext } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const ctx = await readAuthContext();
  if (!ctx.ok || ctx.role !== "ADMIN") redirect("/app");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">用户管理</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          管理用户状态、创建班级，并启用或禁用账号访问权限。
        </p>
      </div>
      <AdminUserList />
    </div>
  );
}
