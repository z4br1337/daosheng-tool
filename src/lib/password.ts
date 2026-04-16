import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const SALT_LEN = 16;
const KEY_LEN = 64;

export function hashPassword(plain: string): string {
  const salt = randomBytes(SALT_LEN).toString("hex");
  const derived = scryptSync(plain, salt, KEY_LEN).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  const idx = stored.indexOf(":");
  if (idx < 1) return false;
  const salt = stored.slice(0, idx);
  const key = stored.slice(idx + 1);
  if (!key) return false;
  try {
    const keyBuf = Buffer.from(key, "hex");
    const derived = scryptSync(plain, salt, KEY_LEN);
    if (keyBuf.length !== derived.length) return false;
    return timingSafeEqual(keyBuf, derived);
  } catch {
    return false;
  }
}
