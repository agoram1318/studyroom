import { createClient } from "@supabase/supabase-js";

/**
 * RLS를 우회하는 서비스 롤 클라이언트.
 * 서버 사이드 전용 — 브라우저에서 절대 사용하지 말 것.
 * 인증/권한 체크는 반드시 이 클라이언트를 쓰기 전에 코드 레벨에서 완료해야 한다.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.",
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
