import Link from "next/link";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ApplicationTable } from "@/components/admin/ApplicationTable";
import { PageHeader } from "@/components/common/PageHeader";
import { applications } from "@/lib/mock-data";

export default function AdminPage() {
  const stats = {
    newApply: applications.length,
    needPayment: applications.filter((item) => item.paymentStatus === "unpaid").length,
    needInvite: applications.filter((item) => item.chatInviteStatus === "need_invite")
      .length,
    uploadPending: 4,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="오늘 처리할 일이 있어요"
        description="신청자, 입금 확인, 톡방 초대, 자료 업로드 상태를 빠르게 확인하는 관리자 화면이에요."
      />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="신규 신청" value={stats.newApply} />
        <AdminStatCard label="입금 확인 필요" value={stats.needPayment} />
        <AdminStatCard label="톡방 초대 필요" value={stats.needInvite} />
        <AdminStatCard label="업로드 대기" value={stats.uploadPending} />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#191F28]">
            최근 신청자
          </h2>
          <div className="flex items-center gap-4">
            <Link href="/admin/studies" className="text-sm font-extrabold text-[#3182F6]">
              스터디 관리
            </Link>
            <Link href="/admin/lessons" className="text-sm font-extrabold text-[#3182F6]">
              회차 자료 관리
            </Link>
            <Link href="/admin/teachers" className="text-sm font-extrabold text-[#3182F6]">
              참여자 관리
            </Link>
            <Link href="/admin/enrollments/import" className="text-sm font-extrabold text-[#3182F6]">
              엑셀 일괄 배정
            </Link>
            <Link href="/admin/applications" className="text-sm font-extrabold text-[#3182F6]">
              신청자 관리 전체보기
            </Link>
          </div>
        </div>
        <ApplicationTable applications={applications.slice(0, 3)} />
      </section>
    </div>
  );
}
