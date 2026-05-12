import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StudyCard } from "@/components/study/StudyCard";
import { getDashboardStudies } from "@/lib/study-room";

export default async function DashboardPage() {
  const { studies, teacherName } = await getDashboardStudies();

  const heroTitle = teacherName
    ? `${teacherName} 선생님,\n환영합니다`
    : "선생님,\n환영합니다";
  const ongoingStudy = studies.find((study) => study.status === "ongoing");

  return (
    <div className="space-y-10">
      <section className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <PageHeader
          title={heroTitle}
          description="참여 중인 스터디의 회차별 영상, 피드백, 자료를 한곳에서 바로 확인할 수 있어요."
        />
        <article className="flex min-h-[260px] flex-col justify-between rounded-[28px] bg-[#191F28] p-7 text-white shadow-[0_12px_28px_rgba(25,31,40,0.06)]">
          <div>
            <p className="text-sm text-white/70">오늘 확인할 항목</p>
            <strong className="mt-3 block text-3xl font-black leading-tight tracking-[-0.05em]">
              피드백 영상 1개
              <br />
              새 자료 2개
            </strong>
          </div>
          <p className="text-sm leading-6 text-white/70">
            중2 기말 내신대비 스터디의 3회차 자료가 업데이트되었어요.
          </p>
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#191F28]">
            최근 업데이트
          </h2>
          <span className="text-sm font-semibold text-[#6B7684]">
            가장 먼저 확인할 내용이에요
          </span>
        </div>
        <article className="flex flex-col justify-between gap-4 rounded-[22px] bg-[#E8F3FF] p-5 md:flex-row md:items-center md:p-6">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusBadge tone="blue">새 영상</StatusBadge>
              <StatusBadge tone="green">진행중</StatusBadge>
            </div>
            <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
              {ongoingStudy?.title} · 3회차 피드백 영상이 올라왔어요
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#6B7684]">
              지난 과제에서 자주 나온 문항 구성 오류와 학교별 변형 포인트를 정리했어요.
            </p>
          </div>
          <Link
            href="/studies/mid2-final/lessons/l3"
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#3182F6] px-4 text-sm font-extrabold text-white"
          >
            바로 보기
          </Link>
        </article>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#191F28]">내 스터디</h2>
          <span className="text-sm font-semibold text-[#6B7684]">
            참여 중인 스터디 {studies.length}개
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {studies.map((study) => (
            <StudyCard key={study.id} study={study} />
          ))}
        </div>
      </section>
    </div>
  );
}
