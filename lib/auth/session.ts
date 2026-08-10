import { createHmac, timingSafeEqual } from "node:crypto";

const maxAgeSeconds = 60 * 60 * 24 * 7;

type SessionPayload = { userId: string; lineSubject: string; expiresAt: number };

function secret() {
  const value = process.env.APP_SESSION_SECRET;
  if (!value) throw new Error("APP_SESSION_SECRET is not configured.");
  return value;
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export function createSession(userId: string, lineSubject: string) {
  const payload: SessionPayload = { userId, lineSubject, expiresAt: Date.now() + maxAgeSeconds * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { value: `${encoded}.${sign(encoded)}`, maxAgeSeconds };
}

export function readSession(value?: string): SessionPayload | null {
  if (!value) return null;
  const [encoded, signature] = value.split(".");
  if (!encoded || !signature) return null;
  const expected = Buffer.from(sign(encoded));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    return payload.expiresAt > Date.now() ? payload : null;
  } catch { return null; }
}
