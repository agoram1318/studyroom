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
  memo: string;
};

const initialForm: FormState = {
  name: "",
  phone: "",
  memo: "",
};

export function TeacherCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdCredential, setCreatedCredential] = useState<{
    username: string;
    tempPassword: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const phoneLast4 = cleanPhoneNumber(form.phone).slice(-4);
  const displayName = form.name.trim() ? `${form.name.trim()}${phoneLast4}` : "";
  const autoUsername = displayName;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setCreatedCredential(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          memo: form.memo,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        success?: boolean;
        teacher?: { username?: string; temp_password?: string };
      };
      if (!response.ok) {
        setError(payload.error ?? "참여자 계정 생성에 실패했습니다.");
        return;
      }

      setSuccess("참여자 계정을 생성했습니다. 아래 임시 비밀번호를 전달해 주세요.");
      setCreatedCredential({
        username: payload.teacher?.username ?? autoUsername,
        tempPassword: payload.teacher?.temp_password ?? "",
      });
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
        아이디는 `이름+전화번호 뒤 4자리`로 자동 생성되고, 비밀번호는 랜덤으로 자동 발급됩니다.
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
          placeholder="전화번호 전체(숫자) 또는 뒤 4자리"
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
        <div className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684] md:col-span-2">
          자동 생성 아이디: <span className="font-extrabold text-[#191F28]">{autoUsername || "-"}</span>
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
        {createdCredential ? (
          <div className="rounded-2xl border border-[#D7E6FB] bg-[#E8F3FF] px-4 py-3 text-sm font-semibold text-[#2E6FD1] md:col-span-2">
            아이디: <span className="font-extrabold">{createdCredential.username}</span> / 임시 비밀번호:{" "}
            <span className="font-extrabold">{createdCredential.tempPassword || "(확인 실패)"}</span>
          </div>
        ) : null}

        <div className="md:col-span-2">
          <Button className="h-11" disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "참여자 추가"}
          </Button>
        </div>
      </form>
    </section>
  );
}
