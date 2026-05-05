"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";

type StudyAdminStatus = "planned" | "ongoing" | "closed";

type ManagedStudy = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: StudyAdminStatus;
  startDate: string;
  endDate: string;
  lessonCount: number;
  code: string;
};

type StudyForm = Omit<ManagedStudy, "id">;

const initialStudies: ManagedStudy[] = [
  {
    id: "s-1",
    name: "중등 25",
    description: "중등 내신대비 실전 문항 스터디",
    category: "중등",
    status: "planned",
    startDate: "2026-05-15",
    endDate: "2026-06-20",
    lessonCount: 5,
    code: "MID25",
  },
  {
    id: "s-2",
    name: "고등 11",
    description: "고등 수학 상 심화 문제풀이",
    category: "고등",
    status: "ongoing",
    startDate: "2026-04-20",
    endDate: "2026-06-01",
    lessonCount: 6,
    code: "HIGH11",
  },
];

const emptyForm: StudyForm = {
  name: "",
  description: "",
  category: "",
  status: "planned",
  startDate: "",
  endDate: "",
  lessonCount: 1,
  code: "",
};

function statusMeta(status: StudyAdminStatus) {
  if (status === "ongoing") return { tone: "green" as const, label: "운영중" };
  if (status === "planned") return { tone: "yellow" as const, label: "준비중" };
  return { tone: "gray" as const, label: "종료" };
}

export default function AdminStudiesPage() {
  const [studies, setStudies] = useState<ManagedStudy[]>(initialStudies);
  const [form, setForm] = useState<StudyForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const duplicateWarning = useMemo(() => {
    const lowerName = form.name.trim().toLowerCase();
    const lowerCode = form.code.trim().toLowerCase();
    return studies.some((study) => {
      if (editingId && study.id === editingId) return false;
      return (
        study.name.trim().toLowerCase() === lowerName ||
        study.code.trim().toLowerCase() === lowerCode
      );
    });
  }, [editingId, form.code, form.name, studies]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const submit = () => {
    if (!form.name.trim() || !form.code.trim()) {
      setMessage("스터디명과 코드값은 필수입니다.");
      return;
    }
    if (duplicateWarning) {
      setMessage("중복된 스터디명 또는 코드값이 있습니다.");
      return;
    }

    if (editingId) {
      setStudies((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, ...form, lessonCount: Number(form.lessonCount) } : item,
        ),
      );
      setMessage("스터디 정보를 수정했습니다.");
    } else {
      const created: ManagedStudy = {
        id: `s-${Date.now()}`,
        ...form,
        lessonCount: Number(form.lessonCount),
      };
      setStudies((prev) => [created, ...prev]);
      setMessage("새 스터디를 생성했습니다.");
    }

    resetForm();
  };

  const startEdit = (study: ManagedStudy) => {
    setEditingId(study.id);
    setForm({
      name: study.name,
      description: study.description,
      category: study.category,
      status: study.status,
      startDate: study.startDate,
      endDate: study.endDate,
      lessonCount: study.lessonCount,
      code: study.code,
    });
    setMessage("수정 모드입니다.");
  };

  const remove = (id: string) => {
    setStudies((prev) => prev.filter((item) => item.id !== id));
    if (editingId === id) resetForm();
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
          예) “중등 25” 스터디를 생성하면, 엑셀의 “중등 25” 열이 해당 스터디로 인식되고 O 표시된
          선생님에게 권한이 자동 부여됩니다.
        </p>
      </section>

      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
          {editingId ? "스터디 수정" : "새 스터디 생성"}
        </h2>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="스터디명"
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
          <input
            value={form.code}
            onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
            placeholder="코드값 (예: MID25)"
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
          <input
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            placeholder="카테고리"
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
          <select
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as StudyAdminStatus }))}
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-bold text-[#4E5968] outline-none"
          >
            <option value="planned">준비중</option>
            <option value="ongoing">운영중</option>
            <option value="closed">종료</option>
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((prev) => ({ ...prev, startDate: e.target.value }))}
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
          <input
            type="date"
            value={form.endDate}
            onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
          <input
            type="number"
            min={1}
            value={form.lessonCount}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, lessonCount: Number(e.target.value || 1) }))
            }
            placeholder="회차 수"
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
          <input
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="설명"
            className="h-11 rounded-2xl border border-[#E5E8EB] px-4 text-sm font-semibold outline-none"
          />
        </div>

        {duplicateWarning ? (
          <p className="mt-3 text-sm font-semibold text-[#F04452]">
            동일한 스터디명 또는 코드값이 이미 존재합니다.
          </p>
        ) : null}
        {message ? <p className="mt-3 text-sm font-semibold text-[#3182F6]">{message}</p> : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={submit}>{editingId ? "수정 저장" : "스터디 생성"}</Button>
          <Button variant="secondary" onClick={resetForm}>
            입력 초기화
          </Button>
        </div>
      </section>

      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">스터디 목록</h2>
        <div className="mt-4 grid gap-3">
          {studies.map((study) => {
            const meta = statusMeta(study.status);
            return (
              <article key={study.id} className="rounded-2xl border border-[#E5E8EB] bg-[#FBFCFD] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-base font-black tracking-[-0.03em] text-[#191F28]">{study.name}</p>
                    <p className="mt-1 text-sm font-semibold text-[#6B7684]">{study.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    <StatusBadge tone="blue">코드: {study.code}</StatusBadge>
                    <StatusBadge tone="gray">{study.lessonCount}회차</StatusBadge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-[#4E5968]">
                  <p>
                    카테고리 {study.category} · {study.startDate} ~ {study.endDate}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="h-9 px-3" onClick={() => startEdit(study)}>
                      수정
                    </Button>
                    <Button variant="secondary" className="h-9 px-3" onClick={() => remove(study.id)}>
                      삭제
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
