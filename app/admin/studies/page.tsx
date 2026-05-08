"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { createClient } from "@/lib/supabase/client";

type StudyStatus = "draft" | "active" | "ended";

type StudyRow = {
  id: string;
  title: string;
  code: string;
  description: string;
  status: StudyStatus;
  start_date: string | null;
  end_date: string | null;
  lesson_count: number;
};

type StudyForm = {
  title: string;
  code: string;
  description: string;
  status: StudyStatus;
  start_date: string;
  end_date: string;
  lesson_count: number;
};

const emptyForm: StudyForm = {
  title: "",
  code: "",
  description: "",
  status: "draft",
  start_date: "",
  end_date: "",
  lesson_count: 1,
};

function statusMeta(status: StudyStatus) {
  if (status === "active") return { tone: "green" as const, label: "운영중" };
  if (status === "draft") return { tone: "yellow" as const, label: "초안" };
  return { tone: "gray" as const, label: "종료" };
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export default function AdminStudiesPage() {
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [form, setForm] = useState<StudyForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshStudies = async () => {
    const supabase = createClient();
    setError("");

    const { data, error: loadError } = await supabase
      .from("studies")
      .select("id, title, code, description, status, start_date, end_date, lesson_count")
      .order("start_date", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setStudies((data as StudyRow[]) ?? []);
  };

  useEffect(() => {
    const supabase = createClient();

    void supabase
      .from("studies")
      .select("id, title, code, description, status, start_date, end_date, lesson_count")
      .order("start_date", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (loadError) {
          setError(loadError.message);
          setIsLoading(false);
          return;
        }
        setStudies((data as StudyRow[]) ?? []);
        setIsLoading(false);
      });
  }, []);

  const duplicateWarning = useMemo(() => {
    const lowerTitle = form.title.trim().toLowerCase();
    const lowerCode = form.code.trim().toLowerCase();
    return studies.some((study) => {
      if (editingId && study.id === editingId) return false;
      return (
        study.title.trim().toLowerCase() === lowerTitle ||
        study.code.trim().toLowerCase() === lowerCode
      );
    });
  }, [editingId, form.code, form.title, studies]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const submit = async () => {
    if (!form.title.trim() || !form.code.trim()) {
      setError("스터디명과 코드값은 필수입니다.");
      return;
    }
    if (duplicateWarning) {
      setError("중복된 스터디명 또는 코드값이 있습니다.");
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      code: form.code.trim(),
      description: form.description.trim() || null,
      status: form.status,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      lesson_count: Number(form.lesson_count),
    };

    if (editingId) {
      const { error: updateError } = await supabase
        .from("studies")
        .update(payload)
        .eq("id", editingId);
      if (updateError) {
        setError(updateError.message);
        setIsSubmitting(false);
        return;
      }
      setMessage("스터디 정보를 수정했습니다.");
    } else {
      const { error: insertError } = await supabase.from("studies").insert(payload);
      if (insertError) {
        setError(insertError.message);
        setIsSubmitting(false);
        return;
      }
      setMessage("새 스터디를 생성했습니다.");
    }

    await refreshStudies();
    setIsLoading(false);
    setIsSubmitting(false);
    resetForm();
  };

  const startEdit = (study: StudyRow) => {
    setEditingId(study.id);
    setForm({
      title: study.title,
      code: study.code,
      description: study.description,
      status: study.status,
      start_date: study.start_date ?? "",
      end_date: study.end_date ?? "",
      lesson_count: study.lesson_count,
    });
    setShowForm(true);
    setMessage("수정 모드입니다.");
  };

  const remove = async (id: string) => {
    const confirmed = window.confirm("정말 이 스터디를 삭제할까요?");
    if (!confirmed) return;

    const supabase = createClient();
    const { error: deleteError } = await supabase.from("studies").delete().eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingId === id) resetForm();
    await refreshStudies();
    setIsLoading(false);
    setMessage("스터디를 삭제했습니다.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="스터디 관리"
        description="관리자가 스터디를 생성/수정/삭제하고, 엑셀 열 매칭에 사용할 기준값(스터디명/코드값)을 관리하는 화면입니다."
      />

      <section className="rounded-[22px] border border-[#D7E6FB] bg-[#E8F3FF] p-5">
        <p className="text-sm font-extrabold text-[#2E6FD1]">
          중요: 스터디명과 코드값은 엑셀 업로드 열 이름 매칭에 사용됩니다.
        </p>
        <p className="mt-2 text-sm leading-6 text-[#4E5968]">
          예) “중등 25” 스터디를 생성하면, 엑셀의 “중등 25” 열이 해당 스터디로 인식되고 O 표시된 선생님에게 권한이 자동 부여됩니다.
        </p>
      </section>

      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">스터디 등록/수정</h2>
          <Button
            variant="primary"
            className="h-10"
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              setForm(emptyForm);
              setError("");
              setMessage("");
            }}
          >
            새 스터디 만들기
          </Button>
        </div>

        {showForm ? (
          <>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="스터디명 title"
                className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="코드 code (예: middle-25)"
                  className="h-11 flex-1 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
                />
                <Button
                  variant="secondary"
                  className="h-11 px-3"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      code: toSlug(prev.code || prev.title),
                    }))
                  }
                >
                  자동
                </Button>
              </div>
              <input
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="설명 description"
                className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none md:col-span-2"
              />
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as StudyStatus }))}
                className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-bold text-[#4E5968] outline-none"
              >
                <option value="draft">draft</option>
                <option value="active">active</option>
                <option value="ended">ended</option>
              </select>
              <input
                type="number"
                min={1}
                value={form.lesson_count}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    lesson_count: Number(e.target.value || 1),
                  }))
                }
                placeholder="회차 수 lesson_count"
                className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
              />
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
                className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
              />
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
                className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
              />
            </div>

            {duplicateWarning ? (
              <p className="mt-3 text-sm font-semibold text-[#F04452]">
                동일한 스터디명 또는 코드값이 이미 존재합니다.
              </p>
            ) : null}
            {error ? (
              <p className="mt-3 text-sm font-semibold text-[#F04452]">{error}</p>
            ) : null}
            {message ? (
              <p className="mt-3 text-sm font-semibold text-[#3182F6]">{message}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={submit} disabled={isSubmitting}>
                {isSubmitting ? "저장 중..." : editingId ? "수정 저장" : "스터디 생성"}
              </Button>
              <Button variant="secondary" onClick={resetForm}>
                취소
              </Button>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm font-semibold text-[#6B7684]">
            새 스터디를 만들거나 기존 스터디를 수정하려면 버튼을 눌러 주세요.
          </p>
        )}
      </section>

      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">스터디 목록</h2>
        <div className="mt-4 grid gap-3">
          {isLoading ? (
            <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
              스터디 목록을 불러오는 중입니다...
            </p>
          ) : studies.length === 0 ? (
            <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
              등록된 스터디가 없습니다.
            </p>
          ) : (
            studies.map((study) => {
              const meta = statusMeta(study.status);
              return (
                <article key={study.id} className="rounded-2xl border border-[#E5E8EB] bg-[#FBFCFD] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-base font-black tracking-[-0.03em] text-[#191F28]">{study.title}</p>
                      <p className="mt-1 text-sm font-semibold text-[#6B7684]">
                        {study.description || "설명 없음"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                      <StatusBadge tone="blue">코드: {study.code}</StatusBadge>
                      <StatusBadge tone="gray">{study.lesson_count}회차</StatusBadge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#4E5968]">
                    <p>
                      {study.start_date || "미정"} ~ {study.end_date || "미정"}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="secondary" className="h-9 px-3" onClick={() => startEdit(study)}>
                        수정
                      </Button>
                      <Button variant="secondary" className="h-9 px-3" onClick={() => void remove(study.id)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
