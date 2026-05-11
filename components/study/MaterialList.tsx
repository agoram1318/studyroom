import { StatusBadge } from "@/components/common/StatusBadge";
import {
  buildGoogleDriveDirectDownloadUrl,
  extractGoogleDriveFileId,
} from "@/lib/google-drive";
import type { Material } from "@/types";

type Props = {
  materials: Material[];
};

const typeLabel: Record<Material["materialType"], string> = {
  pdf: "PDF",
  image: "이미지",
  link: "링크",
};

function downloadHrefFor(material: Material): string {
  const id = extractGoogleDriveFileId(material.fileUrl);
  if (id) return buildGoogleDriveDirectDownloadUrl(id);
  return material.fileUrl;
}

export function MaterialList({ materials }: Props) {
  return (
    <div className="mt-4 grid gap-2.5">
      {materials.map((material) => {
        const viewUrl = material.fileUrl;
        const dlUrl = downloadHrefFor(material);

        return (
          <div
            key={material.id}
            className="flex flex-col gap-3 rounded-2xl bg-[#F7F8FA] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="truncate text-sm font-bold text-[#191F28]">
                {material.title}
              </span>
              <StatusBadge tone="gray">{typeLabel[material.materialType]}</StatusBadge>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a
                href={viewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-xl border border-[#E5E8EB] bg-white px-3 text-xs font-extrabold text-[#191F28] shadow-sm transition hover:bg-[#F2F4F6]"
              >
                보기
              </a>
              <a
                href={dlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 min-w-[4.5rem] items-center justify-center rounded-xl bg-[#3182F6] px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#256bef]"
              >
                다운로드
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
