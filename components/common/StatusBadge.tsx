import type { BadgeTone } from "@/types";
import type { ReactNode } from "react";

type Props = {
  tone: BadgeTone;
  children: ReactNode;
};

const toneStyle: Record<BadgeTone, string> = {
  blue: "bg-[#E8F3FF] text-[#3182F6]",
  green: "bg-[#E9F8F0] text-[#00A661]",
  yellow: "bg-[#FFF7DF] text-[#9A6400]",
  red: "bg-[#FFF0F1] text-[#F04452]",
  gray: "bg-[#F2F4F6] text-[#6B7684]",
};

export function StatusBadge({ tone, children }: Props) {
  return (
    <span
      className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-extrabold ${toneStyle[tone]}`}
    >
      {children}
    </span>
  );
}
