import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  role: "admin" | "teacher" | null;
};

type TeacherPayload = {
  account_id?: string;
  name: string;
  phone: string;
  memo?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function buildAuthEmail() {
  return `user_${crypto.randomUUID().replace(/-/g, "")}@studyroom.local`;
}

function toUsername(name: string, phone: string) {
  return `${name.replace(/\s+/g, "")}${phone.slice(-4)}`;
}

function splitAccountId(accountId: string) {
  const trimmed = accountId.trim();
  const match = trimmed.match(/^(.*?)(\d{4})$/);
  if (!match) return null;
  const name = match[1].trim();
  const last4 = match[2];
  if (!name) return null;
  return { name, last4 };
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
    const fromAccountId = splitAccountId(row.account_id ?? "");
    const name = fromAccountId?.name ?? (row.name ?? "").trim();
    const phone = fromAccountId?.last4 ?? onlyDigits(row.phone ?? "");
    const memo = row.memo?.trim() || null;
    const username = name && phone ? toUsername(name, phone) : "";

    if (!name || !phone) {
      skipped.push({ username: username || "(빈값)", reason: "필수 값 누락" });
      continue;
    }
    if (!/^(\d{4}|\d{10,11})$/.test(phone)) {
      skipped.push({ username, reason: "전화번호는 10~11자리 또는 뒤 4자리여야 함" });
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

    const authEmail = buildAuthEmail();
    const tempPassword = generateRandomPassword();
    const { data: createdUser, error: createUserError } = await adminClient.auth.admin.createUser({
      email: authEmail,
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
      auth_email: authEmail,
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
      email: authEmail,
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
