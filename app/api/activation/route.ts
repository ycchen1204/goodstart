import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get("goodstart_session")?.value);
  if (!session) return NextResponse.json({ error: "請先以 LINE 登入。" }, { status: 401 });
  const { cohortId, activationCode } = await request.json() as { cohortId?: string; activationCode?: string };
  if (!cohortId || !activationCode) return NextResponse.json({ error: "請填寫班級與啟用碼。" }, { status: 400 });
  const codeHash = createHash("sha256").update(activationCode.trim().toUpperCase()).digest("hex");
  const { error } = await createServerSupabaseClient().rpc("activate_membership", { p_user_id: session.userId, p_cohort_id: cohortId, p_code_hash: codeHash });
  if (error) return NextResponse.json({ error: error.message.includes("ALREADY_USED") ? "此啟用碼已使用。" : "找不到此啟用碼，或它不屬於選擇的班級。" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
