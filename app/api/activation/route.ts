import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = readSession(request.cookies.get("goodstart_session")?.value);
  if (!session) return NextResponse.json({ error: "請先以 LINE 登入。" }, { status: 401 });
  const body = await request.json().catch(() => null) as { cohortId?: string; activationCode?: string } | null;
  const cohortId = body?.cohortId;
  const activationCode = body?.activationCode;
  if (!cohortId || !activationCode) return NextResponse.json({ error: "請填寫班級與啟用碼。" }, { status: 400 });
  const codeHash = createHash("sha256").update(activationCode.trim().toUpperCase()).digest("hex");
  const { data: membershipId, error } = await createServerSupabaseClient().rpc("activate_membership", {
    p_user_id: session.userId,
    p_cohort_id: cohortId,
    p_code_hash: codeHash,
  });
  if (error) {
    const message = error.message.includes("ACTIVATION_CODE_ALREADY_USED")
      ? "此啟用碼已使用。"
      : "找不到此啟用碼，或它不屬於選擇的班級。";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true, membershipId, cohortId });
}
