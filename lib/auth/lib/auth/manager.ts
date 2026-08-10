import { NextRequest } from "next/server";
import { readSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function requireManager(request: NextRequest) {
  const session = readSession(request.cookies.get("goodstart_session")?.value);
  if (!session) return { error: "請先以 LINE 登入。", status: 401 as const };

  const { data: user } = await createServerSupabaseClient()
    .from("app_users")
    .select("id, role")
    .eq("id", session.userId)
    .single();
  if (!user || user.role !== "manager") return { error: "此功能僅限管理者使用。", status: 403 as const };
  return { userId: user.id };
}
