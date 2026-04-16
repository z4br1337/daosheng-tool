import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export type AppSessionData = {
  userId?: string;
  classId?: string;
  role?: "ADMIN" | "USER";
};

function sessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  if (process.env.NODE_ENV === "development") {
    return "dev-only-32-char-secret-key!!!!!";
  }
  throw new Error("SESSION_SECRET 未设置或长度不足 32 字符");
}

const cookieName = "student_viz_session";

export async function getSession(): Promise<IronSession<AppSessionData>> {
  const options: SessionOptions = {
    password: sessionSecret(),
    cookieName,
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    },
  };
  return getIronSession<AppSessionData>(await cookies(), options);
}

export type AuthContext =
  | { ok: true; userId: string; classId: string; role: "ADMIN" | "USER" }
  | { ok: false };

export async function readAuthContext(): Promise<AuthContext> {
  const session = await getSession();
  if (!session.userId || !session.classId || !session.role) return { ok: false };
  return { ok: true, userId: session.userId, classId: session.classId, role: session.role };
}
