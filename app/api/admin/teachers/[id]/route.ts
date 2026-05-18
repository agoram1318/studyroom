import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  role: "admin" | "teacher" | null;
};

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: targetId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single<ProfileRow>();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  }

  if (user.id === targetId) {
    return NextResponse.json({ error: "자기 자신은 삭제할 수 없습니다." }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: targetProfile } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", targetId)
    .single<ProfileRow>();

  if (!targetProfile) {
    return NextResponse.json({ error: "해당 참여자를 찾을 수 없습니다." }, { status: 404 });
  }

  if (targetProfile.role === "admin") {
    return NextResponse.json({ error: "관리자 계정은 삭제할 수 없습니다." }, { status: 403 });
  }

  if (targetProfile.role !== "teacher") {
    return NextResponse.json({ error: "참여자 계정만 삭제할 수 있습니다." }, { status: 400 });
  }

  // enrollments 먼저 삭제 (cascade 미보장 시 명시적으로 처리)
  await adminClient.from("enrollments").delete().eq("teacher_id", targetId);

  // profiles 삭제 (cascade 미보장 시 명시적으로 처리)
  await adminClient.from("profiles").delete().eq("id", targetId);

  // Supabase Auth 유저 삭제
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(targetId);

  if (deleteAuthError) {
    return NextResponse.json(
      { error: deleteAuthError.message ?? "계정 삭제에 실패했습니다." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
