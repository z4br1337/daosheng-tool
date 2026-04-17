import { AppShell } from "@/components/AppShell";
import { getUserApprovalById } from "@/lib/auth-cache";
import { readAuthContext } from "@/lib/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppAreaLayout({ children }: { children: React.ReactNode }) {
  const ctx = await readAuthContext();
  if (!ctx.ok) redirect("/");

  const user = await getUserApprovalById(ctx.userId);
  if (!user?.approved) redirect("/pending");

  return <AppShell isAdmin={ctx.role === "ADMIN"}>{children}</AppShell>;
}
