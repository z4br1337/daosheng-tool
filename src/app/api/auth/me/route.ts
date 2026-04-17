import { prisma } from "@/lib/prisma";
import { readAuthContext } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ctx = await readAuthContext();
    if (!ctx.ok) return NextResponse.json({ authenticated: false });

    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: {
        id: true,
        studentNo: true,
        name: true,
        role: true,
        approved: true,
      },
    });
    if (!user) return NextResponse.json({ authenticated: false });

    return NextResponse.json({
      authenticated: true,
      userId: user.id,
      studentNo: user.studentNo,
      name: user.name,
      role: user.role,
      approved: user.approved,
      classId: ctx.classId,
    });
  } catch (e) {
    console.error("[auth/me]", e);
    return NextResponse.json({ authenticated: false });
  }
}
