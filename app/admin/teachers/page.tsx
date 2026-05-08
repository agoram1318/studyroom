import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { TeacherCreateForm } from "@/components/admin/TeacherCreateForm";
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

      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">참여자 목록</h2>
          <Link href="/admin/enrollments/import" className="text-sm font-extrabold text-[#3182F6]">
            엑셀 일괄 배정
          </Link>
        </div>

        <div className="grid gap-3">
          {(teachers ?? []).length === 0 ? (
            <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
              등록된 참여자가 없습니다.
            </p>
          ) : (
            (teachers ?? []).map((teacher) => (
              <article key={teacher.id} className="rounded-2xl border border-[#E5E8EB] bg-[#FBFCFD] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-black tracking-[-0.03em] text-[#191F28]">
                      {teacher.display_name ?? teacher.name ?? "이름 없음"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#6B7684]">
                      아이디: {teacher.username ?? "-"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="blue">참여자</StatusBadge>
                    {teacher.phone ? <StatusBadge tone="gray">{teacher.phone}</StatusBadge> : null}
                  </div>
                </div>
                {teacher.memo ? (
                  <p className="mt-3 text-sm leading-6 text-[#6B7684]">메모: {teacher.memo}</p>
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
