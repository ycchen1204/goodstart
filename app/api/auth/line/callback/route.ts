import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type LineTokenResponse = { id_token?: string };
type LineProfile = { sub: string; name?: string };

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get("goodstart_line_state")?.value;
  const channelId = process.env.LINE_CHANNEL_ID;
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const callbackUrl = process.env.LINE_CALLBACK_URL;

  if (!code || !state || !expectedState || state !== expectedState || !channelId || !channelSecret || !callbackUrl) {
    return NextResponse.redirect(new URL("/?login=failed", request.url));
  }

  const tokenResponse = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: callbackUrl, client_id: channelId, client_secret: channelSecret }),
  });
  const token = await tokenResponse.json() as LineTokenResponse;
  if (!tokenResponse.ok || !token.id_token) return NextResponse.redirect(new URL("/?login=failed", request.url));

  const verifyResponse = await fetch("https://api.line.me/oauth2/v2.1/verify", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ id_token: token.id_token, client_id: channelId }),
  });
  const profile = await verifyResponse.json() as LineProfile;
  if (!verifyResponse.ok || !profile.sub) return NextResponse.redirect(new URL("/?login=failed", request.url));

  const supabase = createServerSupabaseClient();
  const { data: user, error } = await supabase.from("app_users").upsert(
    { line_subject: profile.sub, display_name: profile.name ?? "LINE 使用者" },
    { onConflict: "line_subject" },
  ).select("id").single();
  if (error || !user) return NextResponse.redirect(new URL("/?login=failed", request.url));

  const session = createSession(user.id, profile.sub);
  const response = NextResponse.redirect(new URL("/?login=success", request.url));
  response.cookies.set("goodstart_session", session.value, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: session.maxAgeSeconds });
  response.cookies.set("goodstart_line_state", "", { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 0 });
  return response;
}
