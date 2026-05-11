/**
 * 구글 드라이브 공유 링크에서 파일 ID를 추출합니다.
 * 지원: /file/d/FILE_ID/..., /open?id=FILE_ID
 */
export function extractGoogleDriveFileId(rawUrl: string): string | null {
  const url = rawUrl?.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("google.com")) return null;

    const fromPath = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    if (fromPath?.[1]) return fromPath[1];

    if (parsed.pathname === "/open" || parsed.pathname === "/open/") {
      const id = parsed.searchParams.get("id");
      if (id) return id;
    }

    return null;
  } catch {
    return null;
  }
}

export function buildGoogleDriveDirectDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
