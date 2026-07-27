"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StudentOption = { id: string; name: string };

type DraftRecord = {
  studentId: string;
  reporterName: string;
  attendance: string;
  learningConfusion: string;
  learningAttitude: string;
  learningNotes: string;
  mentalState: string;
  mentalNotes: string;
};

const emptyDraft = (): DraftRecord => ({
  studentId: "",
  reporterName: "",
  attendance: "",
  learningConfusion: "",
  learningAttitude: "",
  learningNotes: "",
  mentalState: "",
  mentalNotes: "",
});

function normalizeDraft(partial: Partial<DraftRecord> | null | undefined): DraftRecord {
  return {
    studentId: typeof partial?.studentId === "string" ? partial.studentId : "",
    reporterName: typeof partial?.reporterName === "string" ? partial.reporterName : "",
    attendance: typeof partial?.attendance === "string" ? partial.attendance : "",
    learningConfusion: typeof partial?.learningConfusion === "string" ? partial.learningConfusion : "",
    learningAttitude: typeof partial?.learningAttitude === "string" ? partial.learningAttitude : "",
    learningNotes: typeof partial?.learningNotes === "string" ? partial.learningNotes : "",
    mentalState: typeof partial?.mentalState === "string" ? partial.mentalState : "",
    mentalNotes: typeof partial?.mentalNotes === "string" ? partial.mentalNotes : "",
  };
}

async function loadServerDraft(): Promise<DraftRecord> {
  try {
    const res = await fetch("/api/records/draft");
    if (!res.ok) return emptyDraft();
    const data = (await res.json()) as { draft?: Partial<DraftRecord> | null };
    return normalizeDraft(data.draft ?? null);
  } catch {
    return emptyDraft();
  }
}

async function saveServerDraft(draft: DraftRecord): Promise<void> {
  try {
    await fetch("/api/records/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
  } catch {
    // fall back to client-side state only; autosave remains best-effort
  }
}

async function clearServerDraft(): Promise<void> {
  try {
    await fetch("/api/records/draft", { method: "DELETE" });
  } catch {
    // ignore
  }
}

export function RecordForm() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [attendance, setAttendance] = useState("");
  const [learningConfusion, setLearningConfusion] = useState("");
  const [learningAttitude, setLearningAttitude] = useState("");
  const [learningNotes, setLearningNotes] = useState("");
  const [mentalState, setMentalState] = useState("");
  const [mentalNotes, setMentalNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const [serverDraft, studentsRes] = await Promise.all([loadServerDraft(), fetch("/api/students")]);
      if (!mounted) return;

      setStudentId(serverDraft.studentId);
      setReporterName(serverDraft.reporterName);
      setAttendance(serverDraft.attendance);
      setLearningConfusion(serverDraft.learningConfusion);
      setLearningAttitude(serverDraft.learningAttitude);
      setLearningNotes(serverDraft.learningNotes);
      setMentalState(serverDraft.mentalState);
      setMentalNotes(serverDraft.mentalNotes);

      if (studentsRes.ok) {
        const data = (await studentsRes.json()) as { students: StudentOption[] };
        setStudents(data.students ?? []);
        if (!serverDraft.studentId && data.students?.[0]) setStudentId(data.students[0].id);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const draft = {
      studentId,
      reporterName,
      attendance,
      learningConfusion,
      learningAttitude,
      learningNotes,
      mentalState,
      mentalNotes,
    } satisfies DraftRecord;
    void saveServerDraft(draft);
  }, [studentId, reporterName, attendance, learningConfusion, learningAttitude, learningNotes, mentalState, mentalNotes]);

  const selectedName = useMemo(() => students.find((s) => s.id === studentId)?.name ?? "", [students, studentId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          role: "MENTOR",
          reporterName,
          attendance: attendance || null,
          learningConfusion: learningConfusion || null,
          learningAttitude: learningAttitude || null,
          learningNotes: learningNotes || null,
          mentalState: mentalState || null,
          mentalNotes: mentalNotes || null,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? "保存失败");
        return;
      }
      setMsg(`已保存到「${selectedName}」的档案`);
      void clearServerDraft();
      setAttendance("");
      setLearningConfusion("");
      setLearningAttitude("");
      setLearningNotes("");
      setMentalState("");
      setMentalNotes("");
      router.refresh();
    } catch {
      setMsg("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">学生</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required={students.length > 0}
          >
            {students.length === 0 ? (
              <option value="">暂无学生，请先导入名单</option>
            ) : null}
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">填写人姓名</label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          value={reporterName}
          onChange={(e) => setReporterName(e.target.value)}
          placeholder="例如：张三（导生）"
          required
        />
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">学习情况</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="课堂出勤" value={attendance} onChange={setAttendance} placeholder="如：全勤 / 偶有迟到" />
          <Field label="学习态度" value={learningAttitude} onChange={setLearningAttitude} placeholder="积极主动 / 被动等" />
        </div>
        <Field
          label="学习困惑"
          value={learningConfusion}
          onChange={setLearningConfusion}
          placeholder="课程难点、学习方法等"
          multiline
        />
        <Field label="其他学习情况" value={learningNotes} onChange={setLearningNotes} placeholder="补充说明" multiline />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">心理情况</h2>
        <Field
          label="近期心理状态"
          value={mentalState}
          onChange={setMentalState}
          placeholder="情绪、压力、人际等观察"
          multiline
        />
        <Field label="心理备注" value={mentalNotes} onChange={setMentalNotes} placeholder="需关注事项" multiline />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={loading || students.length === 0}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "提交中…" : "保存记录"}
        </button>
        {msg ? <span className="text-sm text-slate-600 dark:text-slate-300">{msg}</span> : null}
      </div>
      {students.length === 0 ? (
        <p className="text-sm text-amber-700 dark:text-amber-300">请先在「学生名单」导入学生。</p>
      ) : null}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        草稿会自动保存在服务器中，重新登录后也能恢复；成功保存后草稿会自动清空。
      </p>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const common =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-500/20 focus:border-indigo-500 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100";
  return (
    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
      {label}
      {multiline ? (
        <textarea className={`${common} min-h-[96px]`} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input className={common} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}
