import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  role: "admin" | "teacher" | null;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function toUsername(name: string, phone: string) {
  return `${name.replace(/\s+/g, "")}${phone.slice(-4)}`;
}

function usernameToEmail(username: string) {
  return `${username}@studyroom.local`;
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

  const body = (await request.json()) as {
    name?: string;
    phone?: string;
    memo?: string;
  };

  const name = body.name?.trim() ?? "";
  const phone = onlyDigits(body.phone ?? "");
  const memo = body.memo?.trim() || null;

  if (!name || !phone) {
    return NextResponse.json({ error: "이름과 전화번호는 필수입니다." }, { status: 400 });
  }

  if (!/^(\d{4}|\d{10,11})$/.test(phone)) {
    return NextResponse.json(
      { error: "전화번호는 10~11자리 또는 뒤 4자리 숫자로 입력해 주세요." },
      { status: 400 },
    );
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
  const username = toUsername(name, phone);
  const email = usernameToEmail(username);
  const phoneLast4 = phone.slice(-4);
  const displayName = `${name}${phoneLast4}`;
  const tempPassword = generateRandomPassword();

  const { data: existingByUsername } = await adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existingByUsername) {
    return NextResponse.json({ error: "이미 사용 중인 아이디입니다." }, { status: 409 });
  }

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
    return NextResponse.json(
      { error: createUserError?.message ?? "계정 생성에 실패했습니다." },
      { status: 400 },
    );
  }

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
    return NextResponse.json({ error: profileUpsertError.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    teacher: {
      id: createdUser.user.id,
      username,
      email,
      name,
      phone,
      display_name: displayName,
      temp_password: tempPassword,
      memo,
    },
  });
}
