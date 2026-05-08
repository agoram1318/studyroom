import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function normalizeUsername(value: string) {
  return value.trim();
}

export async function POST(request: Request) {
  const body = (await request.json()) as { username?: string };
  const username = normalizeUsername(body.username ?? "");

  if (!username) {
    return NextResponse.json({ error: "아이디가 필요합니다." }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !url) {
    return NextResponse.json(
      { error: "서버 환경변수(SUPABASE_SERVICE_ROLE_KEY)가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  const adminClient = createSupabaseClient(url, serviceRoleKey);
  const { data: profile } = await adminClient
    .from("profiles")
    .select("auth_email")
    .eq("username", username)
    .maybeSingle<{ auth_email: string | null }>();

  if (!profile?.auth_email) {
    return NextResponse.json({ error: "등록된 아이디를 찾을 수 없습니다." }, { status: 404 });
  }

  return NextResponse.json({ auth_email: profile.auth_email });
}
