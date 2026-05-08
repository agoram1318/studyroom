import Link from "next/link";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Material } from "@/types";

type Props = {
  materials: Material[];
};

export function MaterialList({ materials }: Props) {
  return (
    <div className="mt-4 grid gap-2.5">
      {materials.map((material) => (
        <div
          key={material.id}
          className="flex items-center justify-between gap-3 rounded-2xl bg-[#F7F8FA] px-4 py-3.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#191F28]">{material.name}</span>
            <StatusBadge tone="gray">{material.type.toUpperCase()}</StatusBadge>
          </div>
          <Link href={material.href} className="text-xs font-extrabold text-[#3182F6]">
            {material.type === "link" ? "링크 열기" : "다운로드"}
          </Link>
        </div>
      ))}
    </div>
  );
}
