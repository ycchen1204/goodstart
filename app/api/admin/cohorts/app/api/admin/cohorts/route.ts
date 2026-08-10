import { NextRequest, NextResponse } from "next/server";
import { requireManager } from "@/lib/auth/manager";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const manager = await requireManager(request);
  if ("error" in manager) return NextResponse.json({ error: manager.error }, { status: manager.status });
  const body = await request.json().catch(() => null) as { name?: string; startsAt?: string } | null;
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: "請填寫班級名稱。" }, { status: 400 });

  const { data, error } = await createServerSupabaseClient()
    .from("cohorts")
    .insert({ name, starts_at: body?.startsAt || null, status: "draft" })
    .select("id, name, starts_at, ends_at, status")
    .single();
  if (error) return NextResponse.json({ error: "無法建立班級。" }, { status: 500 });
  return NextResponse.json({ cohort: data }, { status: 201 });
}
