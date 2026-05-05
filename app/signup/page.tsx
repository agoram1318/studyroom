"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";
import { createClient } from "@/lib/supabase/client";

function cleanPhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

function isValidPhoneNumber(cleanedPhone: string) {
  return /^\d{10,11}$/.test(cleanedPhone);
}

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanedPhone = useMemo(() => cleanPhoneNumber(phone), [phone]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }

    if (!isValidPhoneNumber(cleanedPhone)) {
      setError("전화번호는 10~11자리 숫자여야 합니다. (예: 01012345678)");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name.trim(),
            phone: cleanedPhone,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setSuccessMessage(
        "회원가입 요청이 완료되었습니다. 이메일 인증 후 로그인해 주세요.",
      );
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      router.push("/login");
    } catch (clientError) {
      const message =
        clientError instanceof Error
          ? clientError.message
          : "회원가입 처리 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[560px] py-6 md:py-10">
      <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-7 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-9">
        <h1 className="text-3xl font-black tracking-[-0.05em] text-[#191F28]">
          회원가입
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#6B7684]">
          이메일/비밀번호로 가입하며, 전화번호는 추가 정보로 저장됩니다.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="이름"
            className="h-12 w-full rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
          />
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="전화번호 (010-1234-5678 또는 01012345678)"
            className="h-12 w-full rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
          />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="이메일"
            className="h-12 w-full rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
          />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
            className="h-12 w-full rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
          />

          <p className="text-xs font-semibold text-[#6B7684]">
            저장 형식: {name.trim() || "이름"} + 전화번호 뒤 4자리 (profiles trigger 기준)
          </p>

          {error ? (
            <p className="rounded-xl bg-[#FFF0F1] px-3 py-2 text-sm font-semibold text-[#F04452]">
              {error}
            </p>
          ) : null}
          {successMessage ? (
            <p className="rounded-xl bg-[#E9F8F0] px-3 py-2 text-sm font-semibold text-[#007A48]">
              {successMessage}
            </p>
          ) : null}

          <Button className="h-12 w-full" disabled={isSubmitting}>
            {isSubmitting ? "가입 처리 중..." : "회원가입"}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm font-semibold text-[#6B7684]">
          이미 계정이 있나요?{" "}
          <Link href="/login" className="font-extrabold text-[#3182F6]">
            로그인
          </Link>
        </p>
      </section>
    </div>
  );
}
