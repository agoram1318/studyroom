import { ApplicationTable } from "@/components/admin/ApplicationTable";
import { PageHeader } from "@/components/common/PageHeader";
import { applications } from "@/lib/mock-data";

export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="신청자 관리"
        description="검색과 필터로 신청자 상태를 빠르게 확인하고 후속 업무를 처리하세요."
      />
      <ApplicationTable applications={applications} />
    </div>
  );
}
