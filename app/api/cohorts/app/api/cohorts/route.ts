import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readSession(request.cookies.get("goodstart_session")?.value);
  if (!session) return NextResponse.json({ error: "請先以 LINE 登入。" }, { status: 401 });

  const { data, error } = await createServerSupabaseClient()
    .from("cohorts")
    .select("id, name, starts_at, ends_at, status")
    .in("status", ["draft", "active"])
    .order("starts_at", { ascending: false, nullsFirst: false });
  if (error) return NextResponse.json({ error: "目前無法讀取班級資料。" }, { status: 500 });

  return NextResponse.json({ cohorts: data ?? [] });
}
