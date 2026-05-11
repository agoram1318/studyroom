import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Lesson } from "@/types";

type Props = {
  studyId: string;
  lessons: Lesson[];
  activeLessonId?: string;
};

export function LessonList({ studyId, lessons, activeLessonId }: Props) {
  if (lessons.length === 0) {
    return (
      <p className="rounded-[18px] bg-[#F7F8FA] px-4 py-5 text-center text-sm font-semibold text-[#6B7684]">
        아직 등록된 회차가 없어요.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {lessons.map((lesson) => {
        const isActive = lesson.id === activeLessonId;
        return (
          <Link
            key={lesson.id}
            href={`/studies/${studyId}/lessons/${lesson.id}`}
            className={`flex items-center justify-between gap-3 rounded-[18px] border p-4 transition ${
              isActive
                ? "border-[#B8D8FF] bg-[#E8F3FF]"
                : "border-[#E5E8EB] bg-white hover:border-[#D6DCE2]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl text-xs font-black ${
                  isActive ? "bg-[#3182F6] text-white" : "bg-[#F2F4F6] text-[#6B7684]"
                }`}
              >
                {lesson.order}
              </span>
              <div>
                <p className="text-sm font-black tracking-[-0.03em] text-[#191F28]">
                  {lesson.title}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#6B7684]">
                  {lesson.summary}
                </p>
              </div>
            </div>
            {lesson.hasNewVideo ? <StatusBadge tone="green">새 영상</StatusBadge> : null}
          </Link>
        );
      })}
    </div>
  );
}
