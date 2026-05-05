import Link from "next/link";
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
          <span className="text-sm font-bold text-[#191F28]">{material.name}</span>
          <Link href={material.href} className="text-xs font-extrabold text-[#3182F6]">
            다운로드
          </Link>
        </div>
      ))}
    </div>
  );
}
