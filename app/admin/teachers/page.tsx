import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { TeacherCreateForm } from "@/components/admin/TeacherCreateForm";
import { TeacherTable } from "@/components/admin/TeacherTable";
import { createClient } from "@/lib/supabase/server";

type TeacherProfileRow = {
  id: string;
  username: string | null;
  name: string | null;
  display_name: string | null;
  phone: string | null;
  memo: string | null;
};

export default async function AdminTeachersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, username, name, display_name, phone, memo")
    .eq("role", "teacher")
    .order("created_at", { ascending: false })
    .returns<TeacherProfileRow[]>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="참여자 관리"
        description="관리자가 참여자 계정을 직접 생성하고, 아이디/표시명/연락처를 관리하는 화면입니다."
      />

      <TeacherCreateForm />

      <div className="flex justify-end">
        <Link href="/admin/enrollments/import" className="text-sm font-extrabold text-[#3182F6]">
          엑셀 일괄 배정
        </Link>
      </div>

      <TeacherTable teachers={teachers ?? []} />
    </div>
  );
}
