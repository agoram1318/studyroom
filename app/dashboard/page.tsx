import Link from "next/link";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { StudyCard } from "@/components/study/StudyCard";
import { getDashboardStudies } from "@/lib/study-room";

/** 받침 유무에 따라 주격 조사(이/가)를 붙임 */
function withSubjectParticle(word: string): string {
  if (!word) return word;
  const code = word.charCodeAt(word.length - 1);
  if (code >= 0xac00 && code <= 0xd7a3) {
    return word + ((code - 0xac00) % 28 !== 0 ? "이" : "가");
  }
  return word;
}

export default async function DashboardPage() {
  const { studies, teacherName, recentMaterials } = await getDashboardStudies();

  const heroTitle = teacherName
    ? `${teacherName} 선생님,\n환영합니다`
    : "선생님,\n환영합니다";

  const latestMaterial = recentMaterials[0] ?? null;

  return (
    <div className="space-y-10">
      {/* ── 히어로 + 최근 자료 업데이트 카드 ── */}
      <section className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <PageHeader
          title={heroTitle}
          description="참여 중인 스터디의 회차별 자료를 한곳에서 바로 확인할 수 있어요."
        />

        <article className="flex min-h-[260px] flex-col justify-between rounded-[28px] bg-[#191F28] p-7 text-white shadow-[0_12px_28px_rgba(25,31,40,0.06)]">
          <div>
            <p className="text-sm text-white/70">최근 자료 업데이트</p>
            {latestMaterial ? (
              <>
                <strong className="mt-3 block text-3xl font-black leading-tight tracking-[-0.05em]">
                  새 자료 {recentMaterials.length}개
                </strong>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  {latestMaterial.studyTitle}에 새 자료가 등록되었어요.
                </p>
              </>
            ) : (
              <>
                <strong className="mt-3 block text-3xl font-black leading-tight tracking-[-0.05em]">
                  새 자료 없음
                </strong>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  참여 중인 스터디에 자료가 등록되면 이곳에 표시됩니다.
                </p>
              </>
            )}
          </div>

          {latestMaterial ? (
            <Link
              href={`/studies/${latestMaterial.studyId}`}
              className="inline-flex h-10 items-center justify-center self-start rounded-2xl bg-white/10 px-4 text-sm font-extrabold text-white transition-colors hover:bg-white/20"
            >
              바로 확인하기
            </Link>
          ) : (
            <Link
              href="#my-studies"
              className="inline-flex h-10 items-center justify-center self-start rounded-2xl bg-white/10 px-4 text-sm font-bold text-white/60"
            >
              내 스터디 보기
            </Link>
          )}
        </article>
      </section>

      {/* ── 최근 업데이트 섹션 ── */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <h2 className="text-2xl font-black tracking-[-0.04em] text-[#191F28]">
            최근 업데이트
          </h2>
          <span className="text-sm font-semibold text-[#6B7684]">
            가장 먼저 확인할 내용이에요
          </span>
        </div>

        {latestMaterial ? (
          <article className="flex flex-col justify-between gap-4 rounded-[22px] bg-[#E8F3FF] p-5 md:flex-row md:items-center md:p-6">
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <StatusBadge tone="blue">새 자료</StatusBadge>
                <StatusBadge tone="green">{latestMaterial.lessonLabel}</StatusBadge>
              </div>
              <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
                {withSubjectParticle(latestMaterial.title)} 등록되었어요
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#6B7684]">
                {latestMaterial.studyTitle} · {latestMaterial.lessonLabel}
              </p>
            </div>
            <Link
              href={`/studies/${latestMaterial.studyId}`}
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-2xl bg-[#3182F6] px-4 text-sm font-extrabold text-white"
            >
              바로 보기
            </Link>
          </article>
        ) : (
          <article className="rounded-[22px] bg-[#F7F8FA] px-5 py-6">
            <p className="text-base font-black tracking-[-0.03em] text-[#191F28]">
              아직 새로 올라온 자료가 없어요.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#6B7684]">
              참여 중인 스터디의 자료가 등록되면 이곳에서 확인할 수 있어요.
            </p>
          </article>
        )}
      </section>

      {/* ── 내 스터디 섹션 ── */}
      <section id="my-studies">
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
