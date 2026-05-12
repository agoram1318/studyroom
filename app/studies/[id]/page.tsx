import Link from "next/link";
import { redirect } from "next/navigation";
import { MaterialList } from "@/components/study/MaterialList";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UNAUTHORIZED, getStudyDetailForViewer } from "@/lib/study-room";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudyDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getStudyDetailForViewer(id);

  if (detail === UNAUTHORIZED) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="rounded-[28px] border border-[#FFD6D6] bg-[#FFF5F5] p-10 shadow-sm">
          <p className="text-4xl">🔒</p>
          <h1 className="mt-4 text-2xl font-black tracking-[-0.04em] text-[#191F28]">
            접근 권한이 없습니다
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7684]">
            이 스터디에 등록되지 않았거나 접근 권한이 없어요.
            <br />
            담당자에게 문의해 주세요.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#3182F6] px-6 text-sm font-extrabold text-white"
          >
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (!detail) {
    redirect("/dashboard");
  }

  const { study, lessons, queryError } = detail;
  const progress =
    study.totalLessons === 0
      ? 0
      : Math.round((study.completedLessons / study.totalLessons) * 100);
  const statusLabel =
    study.status === "ongoing" ? "진행중" : study.status === "scheduled" ? "예정" : "종료";
  const statusTone =
    study.status === "ongoing"
      ? ("green" as const)
      : study.status === "scheduled"
        ? ("yellow" as const)
        : ("gray" as const);

  return (
    <div className="space-y-6">
      {/* DB 오류 표시 */}
      {queryError ? (
        <div className="rounded-2xl border border-[#FFB3B3] bg-[#FFF0F0] px-4 py-3 text-xs font-mono text-[#C0392B]">
          <strong>DB 오류:</strong> {queryError}
        </div>
      ) : null}

      <PageHeader
        title={study.title}
        description={study.subtitle}
        badges={
          <>
            <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
            <StatusBadge tone="blue">
              {study.totalLessons}회차
            </StatusBadge>
            <StatusBadge tone="gray">진행률 {progress}%</StatusBadge>
          </>
        }
      />

      {/* ── 전회차 자료 ── */}
      {detail.studyMaterials.length > 0 ? (
        <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-6">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">전회차 자료</h2>
          <p className="mt-1 text-sm text-[#6B7684]">
            모든 회차에서 공통으로 제공되는 자료입니다.
          </p>
          <MaterialList materials={detail.studyMaterials} />
        </section>
      ) : null}

      {/* ── 회차별 피드백 자료 ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
          회차별 피드백 자료
        </h2>

        {lessons.length === 0 ? (
          <p className="rounded-[22px] bg-[#F7F8FA] px-5 py-6 text-center text-sm font-semibold text-[#6B7684]">
            아직 등록된 회차가 없어요.
          </p>
        ) : (
          lessons.map((lesson) => {
            const mats = detail.lessonMaterials[lesson.id] ?? [];
            return (
              <article
                key={lesson.id}
                className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-6"
              >
                {/* 회차 헤더 */}
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="blue">{lesson.order}회차</StatusBadge>
                  <StatusBadge tone={mats.length > 0 ? "yellow" : "gray"}>
                    자료 {mats.length}개
                  </StatusBadge>
                </div>

                <h3 className="mt-3 text-lg font-black tracking-[-0.03em] text-[#191F28]">
                  {lesson.title}
                </h3>

                {lesson.summary ? (
                  <p className="mt-1 text-sm leading-6 text-[#6B7684]">{lesson.summary}</p>
                ) : null}

                {/* 피드백 자료 목록 */}
                <div className="mt-4">
                  {mats.length > 0 ? (
                    <MaterialList materials={mats} />
                  ) : (
                    <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
                      아직 등록된 피드백 자료가 없어요.
                    </p>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
