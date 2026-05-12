"use client";

import Link from "next/link";
import { useTransition } from "react";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { StudyStatus } from "@/types";

type Props = {
  study: {
    id: string;
    title: string;
    status: StudyStatus;
    totalLessons: number;
    completedLessons: number;
    latestUpdate: string;
  };
};

function getStatusMeta(status: StudyStatus) {
  if (status === "ongoing") return { tone: "green" as const, label: "진행중" };
  if (status === "scheduled") return { tone: "yellow" as const, label: "예정" };
  return { tone: "gray" as const, label: "종료" };
}

export function StudyCard({ study }: Props) {
  const [isPending, startTransition] = useTransition();
  const progress =
    study.totalLessons === 0
      ? 0
      : Math.round((study.completedLessons / study.totalLessons) * 100);
  const statusMeta = getStatusMeta(study.status);

  return (
    <article className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]">
      <div className="mb-3 flex flex-wrap gap-2">
        <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
        {study.status === "ongoing" ? (
          <StatusBadge tone="blue">새 업데이트</StatusBadge>
        ) : null}
      </div>
      <h3 className="text-[19px] font-black tracking-[-0.035em] text-[#191F28]">
        {study.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[#6B7684]">{study.latestUpdate}</p>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#6B7684]">
          <span>진행률</span>
          <span>
            {study.completedLessons}/{study.totalLessons}회차
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[#EEF1F4]">
          <div
            className="h-full rounded-full bg-[#3182F6]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link
        href={`/studies/${study.id}`}
        prefetch={true}
        aria-disabled={isPending}
        onClick={() => startTransition(() => {})}
        className={`mt-5 flex items-center justify-between text-sm font-extrabold transition-opacity ${
          isPending ? "pointer-events-none opacity-50" : "text-[#3182F6]"
        }`}
      >
        <span>{isPending ? "불러오는 중..." : "스터디룸 입장"}</span>
        <span aria-hidden>{isPending ? "⋯" : "→"}</span>
      </Link>
    </article>
  );
}
