import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  role: "admin" | "teacher" | null;
};

type TeacherPayload = {
  name: string;
  phone: string;
  username: string;
  memo?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function usernameToEmail(username: string) {
  return `${username.toLowerCase()}@studyroom.local`;
}

function generateRandomPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";
  const random = crypto.getRandomValues(new Uint32Array(length));
  let password = "";
  for (let i = 0; i < length; i += 1) {
    password += chars[random[i] % chars.length];
  }
  return password;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  const body = (await request.json()) as { teachers?: TeacherPayload[] };
  const teachers = body.teachers ?? [];
  if (teachers.length === 0) {
    return NextResponse.json({ error: "업로드할 참여자 데이터가 없습니다." }, { status: 400 });
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
  const created: Array<{
    username: string;
    name: string;
    phone: string;
    display_name: string;
    email: string;
    temp_password: string;
  }> = [];
  const skipped: Array<{ username: string; reason: string }> = [];

  for (const row of teachers) {
    const name = (row.name ?? "").trim();
    const username = (row.username ?? "").trim().toLowerCase();
    const phone = onlyDigits(row.phone ?? "");
    const memo = row.memo?.trim() || null;

    if (!name || !username || !phone) {
      skipped.push({ username: username || "(빈값)", reason: "필수 값 누락" });
      continue;
    }
    if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
      skipped.push({ username, reason: "아이디 형식 오류" });
      continue;
    }
    if (!/^\d{10,11}$/.test(phone)) {
      skipped.push({ username, reason: "전화번호 형식 오류" });
      continue;
    }

    const { data: existingByUsername } = await adminClient
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existingByUsername) {
      skipped.push({ username, reason: "이미 사용 중인 아이디" });
      continue;
    }

    const email = usernameToEmail(username);
    const tempPassword = generateRandomPassword();
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name,
        phone,
        username,
      },
    });

    if (createUserError || !createdUser.user) {
      skipped.push({ username, reason: createUserError?.message ?? "Auth 계정 생성 실패" });
      continue;
    }

    const phoneLast4 = phone.slice(-4);
    const displayName = `${name}${phoneLast4}`;
    const { error: profileUpsertError } = await adminClient.from("profiles").upsert({
      id: createdUser.user.id,
      role: "teacher",
      name,
      username,
      phone,
      phone_last4: phoneLast4,
      display_name: displayName,
      memo,
    });

    if (profileUpsertError) {
      skipped.push({ username, reason: profileUpsertError.message });
      continue;
    }

    created.push({
      username,
      name,
      phone,
      display_name: displayName,
      email,
      temp_password: tempPassword,
    });
  }

  return NextResponse.json({
    success: true,
    created_count: created.length,
    skipped_count: skipped.length,
    created,
    skipped,
  });
}
