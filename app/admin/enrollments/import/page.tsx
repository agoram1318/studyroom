import { EnrollmentImportPanel } from "@/components/admin/EnrollmentImportPanel";
import { PageHeader } from "@/components/common/PageHeader";
import {
  existingEnrollments,
  existingStudyCatalog,
  existingTeachers,
} from "@/lib/mock-data";

export default function EnrollmentImportPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="스터디 권한 일괄 배정 가져오기"
        description="엑셀 배정표를 업로드해 적용 전에 미리보기로 신규 선생님/신규 스터디/추가 권한 수를 확인하세요."
      />
      <EnrollmentImportPanel
        existingTeachers={existingTeachers}
        existingStudies={existingStudyCatalog}
        existingEnrollments={existingEnrollments}
      />
    </div>
  );
}
