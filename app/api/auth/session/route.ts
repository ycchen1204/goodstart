import { NextRequest, NextResponse } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = readSession(request.cookies.get("goodstart_session")?.value);
  if (!session) return NextResponse.json({ authenticated: false });

  const supabase = createServerSupabaseClient();
  const { data: user } = await supabase
    .from("app_users")
    .select("id, display_name, department, role")
    .eq("id", session.userId)
    .single();
  if (!user) return NextResponse.json({ authenticated: false });

  const { data: memberships } = await supabase
    .from("memberships")
    .select("id, cohort_id, cohorts(id, name)")
    .eq("user_id", user.id);
  return NextResponse.json({ authenticated: true, user, memberships: memberships ?? [] });
}
