"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/common/Button";

function cleanPhoneNumber(value: string) {
  return value.replace(/\D/g, "");
}

type FormState = {
  name: string;
  phone: string;
  username: string;
  password: string;
  memo: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  username: "",
  password: "",
  memo: "",
};

export function TeacherCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneLast4 = cleanPhoneNumber(form.phone).slice(-4);
  const displayName = form.name.trim() ? `${form.name.trim()}${phoneLast4}` : "";

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          username: form.username,
          password: form.password,
          memo: form.memo,
        }),
      });

      const payload = (await response.json()) as { error?: string; success?: boolean };
      if (!response.ok) {
        setError(payload.error ?? "참여자 계정 생성에 실패했습니다.");
        return;
      }

      setSuccess("참여자 계정을 생성했습니다. 아이디와 비밀번호를 전달해 주세요.");
      setForm(initialForm);
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "요청 처리에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
      <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">참여자 계정 생성</h2>
      <p className="mt-2 text-sm leading-6 text-[#6B7684]">
        이름과 전화번호를 기준으로 표시명을 자동 생성하고, 아이디는 내부 이메일로 변환됩니다.
      </p>

      <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={submit}>
        <input
          value={form.name}
          onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          placeholder="이름"
          className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
        />
        <input
          value={form.phone}
          onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
          placeholder="전화번호 (숫자만)"
          className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
        />
        <input
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="아이디 (영문/숫자)"
          className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
        />
        <input
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="초기 비밀번호"
          type="password"
          className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
        />
        <input
          value={form.memo}
          onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
          placeholder="메모 (선택)"
          className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none md:col-span-2"
        />

        <div className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684] md:col-span-2">
          자동 생성 표시명: <span className="font-extrabold text-[#191F28]">{displayName || "-"}</span>
        </div>

        {error ? (
          <p className="rounded-xl bg-[#FFF0F1] px-3 py-2 text-sm font-semibold text-[#F04452] md:col-span-2">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-xl bg-[#E9F8F0] px-3 py-2 text-sm font-semibold text-[#007A48] md:col-span-2">
            {success}
          </p>
        ) : null}

        <div className="md:col-span-2">
          <Button className="h-11" disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "참여자 계정 생성"}
          </Button>
        </div>
      </form>
    </section>
  );
}
