import Link from "next/link";
import { redirect } from "next/navigation";
import { LessonList } from "@/components/study/LessonList";
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

  const { study, lessons } = detail;
  const progress =
    study.totalLessons === 0
      ? 0
      : Math.round((study.completedLessons / study.totalLessons) * 100);
  const statusLabel =
    study.status === "ongoing" ? "진행중" : study.status === "scheduled" ? "예정" : "종료";
  const statusTone =
    study.status === "ongoing" ? ("green" as const) : study.status === "scheduled" ? ("yellow" as const) : ("gray" as const);

  return (
    <div className="space-y-6">
      <PageHeader
        title={study.title}
        description={study.subtitle}
        badges={
          <>
            <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
            <StatusBadge tone="blue">
              {study.completedLessons}/{study.totalLessons}회차
            </StatusBadge>
            <StatusBadge tone="gray">진행률 {progress}%</StatusBadge>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[330px_1fr] lg:items-start">
        <aside className="rounded-[28px] border border-[#E5E8EB] bg-white p-4 shadow-[0_12px_28px_rgba(25,31,40,0.06)] lg:sticky lg:top-24">
          <h2 className="mb-3 text-lg font-black tracking-[-0.03em] text-[#191F28]">
            회차 목록
          </h2>
          <LessonList
            studyId={study.id}
            lessons={lessons.map((lesson) => ({
              id: lesson.id,
              order: lesson.order,
              title: lesson.title,
              summary: lesson.hasVideo
                ? `피드백 영상 있음 · 자료 ${lesson.materialCount}개`
                : "아직 피드백 영상이 준비되지 않았어요.",
              status: lesson.hasVideo ? "uploaded" : "soon",
              hasNewVideo: lesson.hasVideo,
              materials: [],
              assignment: {
                title: "",
                dueDate: "미정",
                submitStatus: "pending",
              },
            }))}
          />
        </aside>

        <section className="space-y-3">
          <article className="rounded-[22px] bg-[#E8F3FF] p-5">
            <StatusBadge tone="blue">공지</StatusBadge>
            <h3 className="mt-3 text-lg font-black tracking-[-0.03em] text-[#191F28]">
              {study.latestUpdate}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6B7684]">{detail.study.notice}</p>
          </article>

          {lessons.map((lesson) => (
            <article
              key={lesson.id}
              className={`rounded-[22px] border bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] ${
                lesson.hasVideo ? "border-[#B8D8FF]" : "border-[#E5E8EB]"
              }`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge tone={lesson.hasVideo ? "blue" : "gray"}>
                  {lesson.order}회차
                </StatusBadge>
                {lesson.hasVideo ? <StatusBadge tone="green">새 영상</StatusBadge> : null}
                <StatusBadge tone={lesson.isPublished ? "blue" : "gray"}>
                  {lesson.isPublished ? "공개중" : "준비중"}
                </StatusBadge>
                {lesson.materialCount > 0 ? (
                  <StatusBadge tone="yellow">자료 있음</StatusBadge>
                ) : null}
              </div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
                {lesson.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7684]">
                {lesson.hasVideo
                  ? `피드백 영상 있음 · 자료 ${lesson.materialCount}개`
                  : "아직 피드백 영상이 준비되지 않았어요."}
              </p>
              <div className="mt-3 space-y-1 text-sm font-semibold text-[#6B7684]">
                <p>피드백 영상 상태: {lesson.hasVideo ? "있음" : "준비중"}</p>
                <p>자료 개수: {lesson.materialCount}개</p>
                <p>공개 여부: {lesson.isPublished ? "공개중" : "준비중"}</p>
              </div>
              <div className="mt-4">
                {lesson.hasVideo || lesson.isPublished ? (
                  <Link
                    href={`/studies/${study.id}/lessons/${lesson.id}`}
                    className="inline-flex h-10 items-center rounded-2xl bg-[#3182F6] px-4 text-sm font-extrabold text-white"
                  >
                    회차 보기
                  </Link>
                ) : (
                  <span className="inline-flex h-10 items-center rounded-2xl bg-[#F2F4F6] px-4 text-sm font-extrabold text-[#191F28]">
                    준비중
                  </span>
                )}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
