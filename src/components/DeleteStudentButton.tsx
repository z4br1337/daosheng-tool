"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteStudentButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`确认删除「${studentName}」及其所有档案记录？此操作不可撤销。`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}/delete`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="touch-manipulation rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 active:bg-red-100 disabled:opacity-60 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-900/30"
    >
      {loading ? "删除中…" : "删除"}
    </button>
  );
}
