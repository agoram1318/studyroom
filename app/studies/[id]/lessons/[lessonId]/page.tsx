import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MaterialList } from "@/components/study/MaterialList";
import { UNAUTHORIZED, getLessonDetailForViewer } from "@/lib/study-room";

type Props = {
  params: Promise<{ id: string; lessonId: string }>;
};

export default async function LessonDetailPage({ params }: Props) {
  const { id, lessonId } = await params;
  const detail = await getLessonDetailForViewer(id, lessonId);

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

  const { study, lesson, prevLessonId, nextLessonId } = detail;
  const playableVideoUrl = lesson.feedbackVideoUrl || lesson.videoUrl;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lesson.order}회차 ${lesson.title}`}
        description={lesson.summary}
        badges={
          <>
            <StatusBadge tone="blue">{lesson.order}회차</StatusBadge>
            <StatusBadge tone={playableVideoUrl ? "green" : "gray"}>
              {playableVideoUrl ? "공개중" : "준비중"}
            </StatusBadge>
          </>
        }
      />

      <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-6">
        <h2 className="mb-4 text-lg font-black tracking-[-0.03em] text-[#191F28]">피드백 영상</h2>
        {playableVideoUrl ? (
          <div className="grid gap-3">
            <div className="grid aspect-video place-items-center rounded-3xl bg-gradient-to-br from-[#191F28] to-[#3A4658] text-white">
              <div className="grid h-[76px] w-[76px] place-items-center rounded-full border border-white/20 bg-white/15 text-2xl backdrop-blur-xl">
                ▶
              </div>
            </div>
            <a
              href={playableVideoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 w-fit items-center justify-center rounded-2xl bg-[#3182F6] px-4 text-sm font-extrabold text-white"
            >
              영상 보기
            </a>
          </div>
        ) : (
          <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
            아직 피드백 영상이 준비되지 않았어요.
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]">
          <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">피드백 자료</h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7684]">
            강의와 함께 보면 좋은 자료를 정리했어요.
          </p>
          {lesson.materials.length > 0 ? (
            <MaterialList materials={lesson.materials} />
          ) : (
            <p className="mt-4 rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
              아직 등록된 자료가 없어요.
            </p>
          )}
        </article>

        <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]">
          <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">과제 및 안내사항</h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7684]">{lesson.assignment.title}</p>
          {"assignmentNote" in lesson && lesson.assignmentNote ? (
            <p className="mt-2 text-sm leading-6 text-[#6B7684]">{lesson.assignmentNote}</p>
          ) : null}
          <div className="mt-4 grid gap-2.5">
            <div className="flex items-center justify-between rounded-2xl bg-[#F7F8FA] px-4 py-3.5">
              <span className="text-sm font-bold text-[#191F28]">제출 마감</span>
              <span className="text-xs font-extrabold text-[#3182F6]">
                {lesson.assignment.dueDate}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-[#F7F8FA] px-4 py-3.5">
              <span className="text-sm font-bold text-[#191F28]">제출 상태</span>
              <StatusBadge
                tone={lesson.assignment.submitStatus === "submitted" ? "green" : "red"}
              >
                {lesson.assignment.submitStatus === "submitted" ? "제출완료" : "미제출"}
              </StatusBadge>
            </div>
          </div>
        </article>
      </section>

      {/* 전회차 자료 */}
      {detail.studyMaterials.length > 0 ? (
        <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-6">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">전회차 자료</h2>
          <p className="mt-1 text-sm text-[#6B7684]">
            스터디 공통으로 제공되는 전회차 자료입니다.
          </p>
          <MaterialList materials={detail.studyMaterials} />
        </section>
      ) : null}

      <section className="flex flex-wrap gap-2">
        <Link
          href={`/studies/${study.id}`}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#F2F4F6] px-4 text-sm font-extrabold text-[#191F28]"
        >
          스터디 상세로 돌아가기
        </Link>
        {prevLessonId ? (
          <Link
            href={`/studies/${study.id}/lessons/${prevLessonId}`}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#F2F4F6] px-4 text-sm font-extrabold text-[#191F28]"
          >
            이전 회차
          </Link>
        ) : null}
        {nextLessonId ? (
          <Link
            href={`/studies/${study.id}/lessons/${nextLessonId}`}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#3182F6] px-4 text-sm font-extrabold text-white"
          >
            다음 회차
          </Link>
        ) : null}
      </section>
    </div>
  );
}
