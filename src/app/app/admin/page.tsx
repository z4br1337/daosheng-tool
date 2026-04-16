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
          审批新注册用户，或禁用已有用户的访问权限。
        </p>
      </div>
      <AdminUserList />
    </div>
  );
}
