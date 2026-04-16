"use client";

import { useEffect, useState } from "react";

type UserItem = {
  id: string;
  studentNo: string;
  name: string;
  role: "ADMIN" | "USER";
  approved: boolean;
  createdAt: string;
};

export function AdminUserList() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [operating, setOperating] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return;
      const data = (await res.json()) as { users: UserItem[] };
      setUsers(data.users ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function toggle(userId: string, approved: boolean) {
    setOperating(userId);
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved }),
      });
      await load();
    } finally {
      setOperating(null);
    }
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  const pending = users.filter((u) => !u.approved && u.role !== "ADMIN");
  const approved = users.filter((u) => u.approved);

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30">
          <div className="border-b border-amber-200 px-5 py-4 dark:border-amber-900/60">
            <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-100">待审批（{pending.length}）</h2>
          </div>
          <ul className="divide-y divide-amber-100 dark:divide-amber-900/40">
            {pending.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">学号 {u.studentNo} · {new Date(u.createdAt).toLocaleDateString("zh-CN")}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(u.id, true)}
                  disabled={operating === u.id}
                  className="touch-manipulation rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60"
                >
                  {operating === u.id ? "处理中…" : "通过"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">暂无待审批用户。</p>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">已审批用户（{approved.length}）</h2>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {approved.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {u.name}
                  {u.role === "ADMIN" ? (
                    <span className="ml-2 inline-flex rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      管理员
                    </span>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">学号 {u.studentNo}</p>
              </div>
              {u.role !== "ADMIN" ? (
                <button
                  type="button"
                  onClick={() => toggle(u.id, false)}
                  disabled={operating === u.id}
                  className="touch-manipulation rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  {operating === u.id ? "处理中…" : "禁用"}
                </button>
              ) : null}
            </li>
          ))}
          {approved.length === 0 ? (
            <li className="px-5 py-8 text-center text-sm text-slate-500">暂无已审批用户</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
}
