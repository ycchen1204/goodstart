import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/auth/manager";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

function makeCode() {
  return `GS-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const manager = await requireManager(request);
  if ("error" in manager) return NextResponse.json({ error: manager.error }, { status: manager.status });
  const body = await request.json().catch(() => null) as { cohortId?: string; count?: number } | null;
  const cohortId = body?.cohortId;
  const count = Number(body?.count ?? 1);
  if (!cohortId || !Number.isInteger(count) || count < 1 || count > 50) {
    return NextResponse.json({ error: "請選擇班級，並輸入 1 至 50 組啟用碼。" }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { data: cohort } = await supabase.from("cohorts").select("id").eq("id", cohortId).single();
  if (!cohort) return NextResponse.json({ error: "找不到指定班級。" }, { status: 404 });

  const codes = Array.from({ length: count }, makeCode);
  const { error } = await supabase.from("activation_codes").insert(codes.map((code) => ({
    cohort_id: cohortId,
    code_hash: createHash("sha256").update(code).digest("hex"),
  })));
  if (error) return NextResponse.json({ error: "無法建立啟用碼，請再試一次。" }, { status: 500 });
  return NextResponse.json({ codes }, { status: 201 });
}
