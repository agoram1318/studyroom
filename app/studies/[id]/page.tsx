import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonList } from "@/components/study/LessonList";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { studies } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudyDetailPage({ params }: Props) {
  const { id } = await params;
  const study = studies.find((item) => item.id === id);

  if (!study) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={study.title}
        description="회차별 영상, 피드백, 수업자료, 과제를 한 페이지에서 정리해서 볼 수 있어요."
        badges={
          <>
            <StatusBadge tone="green">진행중</StatusBadge>
            <StatusBadge tone="blue">
              {study.completedLessons}/{study.totalLessons}회차
            </StatusBadge>
            <StatusBadge tone="gray">다시보기 가능</StatusBadge>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[330px_1fr] lg:items-start">
        <aside className="rounded-[28px] border border-[#E5E8EB] bg-white p-4 shadow-[0_12px_28px_rgba(25,31,40,0.06)] lg:sticky lg:top-24">
          <h2 className="mb-3 text-lg font-black tracking-[-0.03em] text-[#191F28]">
            회차 목록
          </h2>
          <LessonList studyId={study.id} lessons={study.lessons} activeLessonId="l3" />
        </aside>

        <section className="space-y-3">
          <article className="rounded-[22px] bg-[#E8F3FF] p-5">
            <StatusBadge tone="blue">공지</StatusBadge>
            <h3 className="mt-3 text-lg font-black tracking-[-0.03em] text-[#191F28]">
              3회차 피드백 영상이 업로드되었어요
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6B7684]">{study.notice}</p>
          </article>

          {study.lessons.map((lesson) => (
            <article
              key={lesson.id}
              className={`rounded-[22px] border bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] ${
                lesson.hasNewVideo ? "border-[#B8D8FF]" : "border-[#E5E8EB]"
              }`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge tone={lesson.hasNewVideo ? "blue" : "gray"}>
                  {lesson.order}회차
                </StatusBadge>
                {lesson.hasNewVideo ? <StatusBadge tone="green">새 영상</StatusBadge> : null}
              </div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
                {lesson.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7684]">{lesson.summary}</p>
              <div className="mt-4">
                <Link
                  href={`/studies/${study.id}/lessons/${lesson.id}`}
                  className={`inline-flex h-10 items-center rounded-2xl px-4 text-sm font-extrabold ${
                    lesson.hasNewVideo
                      ? "bg-[#3182F6] text-white"
                      : "bg-[#F2F4F6] text-[#191F28]"
                  }`}
                >
                  보기
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
