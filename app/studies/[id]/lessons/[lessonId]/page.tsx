import { notFound } from "next/navigation";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { MaterialList } from "@/components/study/MaterialList";
import { studies } from "@/lib/mock-data";

type Props = {
  params: Promise<{ id: string; lessonId: string }>;
};

export default async function LessonDetailPage({ params }: Props) {
  const { id, lessonId } = await params;
  const study = studies.find((item) => item.id === id);
  const lesson = study?.lessons.find((item) => item.id === lessonId);

  if (!study || !lesson) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${lesson.order}회차 ${lesson.title}`}
        description="이번 회차에서는 제출 과제의 공통 피드백과 학교별 문항 구성 포인트를 정리해요."
        badges={
          <>
            <StatusBadge tone="blue">{lesson.order}회차</StatusBadge>
            <StatusBadge tone="green">영상 공개중</StatusBadge>
          </>
        }
      />

      <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-6">
        <div className="grid aspect-video place-items-center rounded-3xl bg-gradient-to-br from-[#191F28] to-[#3A4658] text-white">
          <div className="grid h-[76px] w-[76px] place-items-center rounded-full border border-white/20 bg-white/15 text-2xl backdrop-blur-xl">
            ▶
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]">
          <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
            이번 회차 자료예요
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7684]">
            강의와 함께 보면 좋은 자료를 정리했어요.
          </p>
          <MaterialList materials={lesson.materials} />
        </article>

        <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]">
          <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">이번 회차 과제</h3>
          <p className="mt-2 text-sm leading-6 text-[#6B7684]">{lesson.assignment.title}</p>
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
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="primary">과제 제출하기</Button>
            <Button variant="secondary" href="#">
              톡방 바로가기
            </Button>
          </div>
        </article>
      </section>
    </div>
  );
}
