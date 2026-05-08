"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { createClient } from "@/lib/supabase/client";

type ProfileRow = {
  role: "admin" | "teacher" | null;
};

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeEmail = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.toLowerCase();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      let email = normalizeEmail(loginId);
      if (!email.includes("@")) {
        const response = await fetch("/api/auth/resolve-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: loginId.trim() }),
        });
        const payload = (await response.json()) as { auth_email?: string; error?: string };
        if (!response.ok || !payload.auth_email) {
          setError(payload.error ?? "등록된 아이디를 찾을 수 없습니다.");
          return;
        }
        email = payload.auth_email;
      }
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError || !data.user) {
        setError(signInError?.message ?? "로그인에 실패했습니다.");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single<ProfileRow>();

      if (profileError) {
        setError("프로필 권한 조회에 실패했습니다.");
        return;
      }

      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (clientError) {
      setError(
        clientError instanceof Error
          ? clientError.message
          : "로그인 처리 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[560px] py-6 md:py-10">
      <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-7 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-9">
        <h1 className="text-3xl font-black tracking-[-0.05em] text-[#191F28]">
          로그인
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6B7684]">
          아이디 또는 이메일과 비밀번호로 로그인해 주세요.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="text"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            placeholder="아이디 또는 이메일"
            className="h-12 w-full rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
            className="h-12 w-full rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
          />

          {error ? (
            <p className="rounded-xl bg-[#FFF0F1] px-3 py-2 text-sm font-semibold text-[#F04452]">
              {error}
            </p>
          ) : null}

          <Button className="h-12 w-full" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </section>
    </div>
  );
}
