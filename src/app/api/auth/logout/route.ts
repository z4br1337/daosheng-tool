import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[logout]", e);
    return NextResponse.json({ error: "退出失败" }, { status: 500 });
  }
}
