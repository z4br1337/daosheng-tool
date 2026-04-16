"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Tab = "login" | "register";

export function AuthTabs() {
  const [tab, setTab] = useState<Tab>("login");

  return (
    <div className="space-y-6">
      <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        <TabButton active={tab === "login"} onClick={() => setTab("login")}>
          登录
        </TabButton>
        <TabButton active={tab === "register"} onClick={() => setTab("register")}>
          注册
        </TabButton>
      </div>
      {tab === "login" ? <LoginForm /> : <RegisterForm onSwitch={() => setTab("login")} />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
        active
          ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function LoginForm() {
  const router = useRouter();
  const [studentNo, setStudentNo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNo, password }),
      });
      let data: { error?: string };
      try {
        data = await res.json();
      } catch {
        setError(`服务器返回异常 (${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "登录失败");
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField label="学号" value={studentNo} onChange={setStudentNo} placeholder="请输入学号" />
      <InputField label="密码" value={password} onChange={setPassword} placeholder="请输入密码" type="password" />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-12 w-full touch-manipulation rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      >
        {loading ? "登录中…" : "登录"}
      </button>
    </form>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [studentNo, setStudentNo] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentNo, name, password }),
      });
      let data: { error?: string; needApproval?: boolean; message?: string };
      try {
        data = await res.json();
      } catch {
        setError(`服务器返回异常 (${res.status})`);
        return;
      }
      if (!res.ok) {
        setError(data.error ?? "注册失败");
        return;
      }
      if (data.needApproval) {
        router.push("/pending");
        router.refresh();
      } else {
        router.push("/app");
        router.refresh();
      }
    } catch {
      setError("网络连接失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <InputField label="学号" value={studentNo} onChange={setStudentNo} placeholder="绑定你的学号" />
      <InputField label="姓名" value={name} onChange={setName} placeholder="你的真实姓名" />
      <InputField label="密码" value={password} onChange={setPassword} placeholder="至少 6 位" type="password" />
      {error ? <p className="text-sm text-red-600 dark:text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="min-h-12 w-full touch-manipulation rounded-xl bg-indigo-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      >
        {loading ? "注册中…" : "注册"}
      </button>
      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        已有账号？
        <button type="button" onClick={onSwitch} className="ml-1 font-semibold text-indigo-600 dark:text-indigo-400">
          去登录
        </button>
      </p>
    </form>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      <input
        type={type}
        autoComplete={type === "password" ? "current-password" : "off"}
        className="mt-1 min-h-11 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm outline-none ring-indigo-500/30 transition focus:border-indigo-500 focus:ring-4 sm:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
      />
    </label>
  );
}
