"use client";

import { useCallback, useEffect, useState } from "react";
import { extractGoogleDriveFileId } from "@/lib/google-drive";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import type { MaterialType } from "@/types";

type StudyOption = {
  id: string;
  title: string;
};

type LessonRow = {
  id: string;
  study_id: string;
  title: string;
  lesson_order: number | null;
};

type MaterialRow = {
  id: string;
  lesson_id: string;
  title: string | null;
  material_type: string | null;
  file_url: string | null;
};

type MaterialForm = {
  title: string;
  material_type: MaterialType;
  file_url: string;
};

const EMPTY_FORM: MaterialForm = {
  title: "",
  material_type: "pdf",
  file_url: "",
};

const TYPE_LABELS: Record<MaterialType, string> = {
  pdf: "PDF",
  image: "이미지",
  link: "링크",
};

function isValidMaterialType(v: string | null | undefined): v is MaterialType {
  return v === "pdf" || v === "image" || v === "link";
}

/** 구글드라이브 링크 검증 표시 */
function DriveIdHint({ url }: { url: string }) {
  if (!url) return null;
  const fileId = extractGoogleDriveFileId(url);
  return (
    <p
      className={`mt-1.5 font-mono text-[11px] ${fileId ? "text-[#3182F6]" : "text-[#F04452]"}`}
    >
      {fileId
        ? `✓ 파일 ID: ${fileId}`
        : "✕ 구글드라이브 링크에서 파일 ID를 찾을 수 없어요. (보기만 가능)"}
    </p>
  );
}

/** 자료 입력 폼 (추가/수정 공용) */
function MaterialFormFields({
  form,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting,
}: {
  form: MaterialForm;
  onChange: (form: MaterialForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel: string;
  isSubmitting: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[#D7E6FB] bg-[#F0F7FF] p-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="자료명"
          className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6]"
        />
        <select
          value={form.material_type}
          onChange={(e) =>
            onChange({ ...form, material_type: e.target.value as MaterialType })
          }
          className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-bold text-[#4E5968] outline-none focus:border-[#3182F6]"
        >
          <option value="pdf">PDF</option>
          <option value="image">이미지</option>
          <option value="link">링크</option>
        </select>
        <div className="sm:col-span-2">
          <input
            value={form.file_url}
            onChange={(e) => onChange({ ...form, file_url: e.target.value })}
            placeholder="구글드라이브 공유 링크 (https://drive.google.com/...)"
            className="h-10 w-full rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6]"
          />
          <DriveIdHint url={form.file_url} />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={onSubmit} disabled={isSubmitting} className="h-9 px-4 text-xs">
          {isSubmitting ? "저장 중..." : submitLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="h-9 px-4 text-xs">
          취소
        </Button>
      </div>
    </div>
  );
}

export default function AdminLessonsPage() {
  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [materials, setMaterials] = useState<Record<string, MaterialRow[]>>({});
  const [addFormLessonId, setAddFormLessonId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<MaterialForm>(EMPTY_FORM);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MaterialForm>(EMPTY_FORM);
  const [isLoadingStudies, setIsLoadingStudies] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // 스터디 목록 로드
  useEffect(() => {
    const supabase = createClient();
    void supabase
      .from("studies")
      .select("id, title")
      .order("start_date", { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        else setStudies((data as StudyOption[]) ?? []);
        setIsLoadingStudies(false);
      });
  }, []);

  // 선택된 스터디의 회차 + 자료 로드
  const loadLessonsAndMaterials = useCallback(
    async (studyId: string) => {
      setIsLoadingLessons(true);
      setLessons([]);
      setMaterials({});
      const supabase = createClient();

      const { data: lessonData, error: lessonError } = await supabase
        .from("lessons")
        .select("id, study_id, title, lesson_order")
        .eq("study_id", studyId)
        .order("lesson_order", { ascending: true })
        .returns<LessonRow[]>();

      if (lessonError) {
        setError(lessonError.message);
        setIsLoadingLessons(false);
        return;
      }

      const rows = lessonData ?? [];
      setLessons(rows);

      if (rows.length > 0) {
        const lessonIds = rows.map((l) => l.id);
        const { data: materialData } = await supabase
          .from("materials")
          .select("id, lesson_id, title, material_type, file_url")
          .in("lesson_id", lessonIds)
          .returns<MaterialRow[]>();

        const map: Record<string, MaterialRow[]> = {};
        for (const m of materialData ?? []) {
          if (!map[m.lesson_id]) map[m.lesson_id] = [];
          map[m.lesson_id].push(m);
        }
        setMaterials(map);
      }

      setIsLoadingLessons(false);
    },
    [],
  );

  useEffect(() => {
    if (selectedStudyId) {
      void loadLessonsAndMaterials(selectedStudyId);
    }
  }, [selectedStudyId, loadLessonsAndMaterials]);

  const handleAddMaterial = async (lessonId: string) => {
    if (!addForm.title.trim() || !addForm.file_url.trim()) {
      setError("자료명과 링크를 모두 입력해 주세요.");
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: insertError } = await supabase.from("materials").insert({
      lesson_id: lessonId,
      title: addForm.title.trim(),
      material_type: addForm.material_type,
      file_url: addForm.file_url.trim(),
    });

    if (insertError) {
      setError(insertError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("자료를 추가했습니다.");
    setAddFormLessonId(null);
    setAddForm(EMPTY_FORM);
    await loadLessonsAndMaterials(selectedStudyId);
    setIsSubmitting(false);
  };

  const handleUpdateMaterial = async (materialId: string) => {
    if (!editForm.title.trim() || !editForm.file_url.trim()) {
      setError("자료명과 링크를 모두 입력해 주세요.");
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("materials")
      .update({
        title: editForm.title.trim(),
        material_type: editForm.material_type,
        file_url: editForm.file_url.trim(),
      })
      .eq("id", materialId);

    if (updateError) {
      setError(updateError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage("자료를 수정했습니다.");
    setEditingMaterialId(null);
    await loadLessonsAndMaterials(selectedStudyId);
    setIsSubmitting(false);
  };

  const handleDeleteMaterial = async (materialId: string) => {
    if (!window.confirm("이 자료를 삭제할까요?")) return;
    setError("");
    setMessage("");

    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("materials")
      .delete()
      .eq("id", materialId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage("자료를 삭제했습니다.");
    await loadLessonsAndMaterials(selectedStudyId);
  };

  const startEditMaterial = (m: MaterialRow) => {
    setEditingMaterialId(m.id);
    setEditForm({
      title: m.title ?? "",
      material_type: isValidMaterialType(m.material_type) ? m.material_type : "link",
      file_url: m.file_url ?? "",
    });
    setAddFormLessonId(null);
    setError("");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="회차 자료 관리"
        description="스터디별 회차에 구글드라이브 자료 링크를 등록하고 관리합니다."
      />

      {/* 구글드라이브 링크 안내 */}
      <section className="rounded-[22px] border border-[#D7E6FB] bg-[#E8F3FF] p-5">
        <p className="text-sm font-extrabold text-[#2E6FD1]">지원하는 구글드라이브 링크 형식</p>
        <ul className="mt-2 space-y-1 font-mono text-xs text-[#4E5968]">
          <li>· https://drive.google.com/file/d/FILE_ID/view?usp=sharing</li>
          <li>· https://drive.google.com/open?id=FILE_ID</li>
        </ul>
      </section>

      {/* 스터디 선택 */}
      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <h2 className="mb-3 text-base font-black tracking-[-0.03em] text-[#191F28]">
          스터디 선택
        </h2>
        {isLoadingStudies ? (
          <p className="text-sm text-[#6B7684]">스터디 목록을 불러오는 중...</p>
        ) : studies.length === 0 ? (
          <p className="text-sm text-[#6B7684]">등록된 스터디가 없어요. 스터디를 먼저 생성해 주세요.</p>
        ) : (
          <select
            value={selectedStudyId}
            onChange={(e) => {
              setSelectedStudyId(e.target.value);
              setAddFormLessonId(null);
              setEditingMaterialId(null);
              setError("");
              setMessage("");
            }}
            className="h-11 w-full max-w-sm rounded-2xl border border-[#E5E8EB] px-4 text-sm font-bold text-[#4E5968] outline-none focus:border-[#3182F6]"
          >
            <option value="">-- 스터디를 선택하세요 --</option>
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        )}
      </section>

      {/* 오류 / 성공 메시지 */}
      {error ? (
        <p className="rounded-2xl bg-[#FFF5F5] px-4 py-3 text-sm font-semibold text-[#F04452]">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-2xl bg-[#F0FFF4] px-4 py-3 text-sm font-semibold text-[#1E8A4A]">
          {message}
        </p>
      ) : null}

      {/* 회차 목록 */}
      {selectedStudyId ? (
        <section className="space-y-3">
          <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">회차별 자료</h2>

          {isLoadingLessons ? (
            <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
              회차를 불러오는 중...
            </p>
          ) : lessons.length === 0 ? (
            <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
              이 스터디에 등록된 회차가 없어요.
            </p>
          ) : (
            lessons.map((lesson) => {
              const lessonMaterials = materials[lesson.id] ?? [];
              return (
                <article
                  key={lesson.id}
                  className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]"
                >
                  {/* 회차 헤더 */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <StatusBadge tone="blue">
                        {lesson.lesson_order ?? "?"}회차
                      </StatusBadge>
                      <h3 className="text-base font-black tracking-[-0.03em] text-[#191F28]">
                        {lesson.title}
                      </h3>
                    </div>
                    <Button
                      variant="secondary"
                      className="h-9 px-3 text-xs"
                      onClick={() => {
                        if (addFormLessonId === lesson.id) {
                          setAddFormLessonId(null);
                        } else {
                          setAddFormLessonId(lesson.id);
                          setAddForm(EMPTY_FORM);
                          setEditingMaterialId(null);
                          setError("");
                        }
                      }}
                    >
                      {addFormLessonId === lesson.id ? "취소" : "+ 자료 추가"}
                    </Button>
                  </div>

                  {/* 자료 없음 안내 */}
                  {lessonMaterials.length === 0 && addFormLessonId !== lesson.id ? (
                    <p className="mt-3 text-sm text-[#6B7684]">
                      아직 등록된 자료가 없어요.
                    </p>
                  ) : null}

                  {/* 자료 목록 */}
                  {lessonMaterials.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {lessonMaterials.map((m) =>
                        editingMaterialId === m.id ? (
                          /* 수정 폼 */
                          <MaterialFormFields
                            key={m.id}
                            form={editForm}
                            onChange={setEditForm}
                            onSubmit={() => void handleUpdateMaterial(m.id)}
                            onCancel={() => setEditingMaterialId(null)}
                            submitLabel="수정 저장"
                            isSubmitting={isSubmitting}
                          />
                        ) : (
                          /* 자료 행 */
                          <div
                            key={m.id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F7F8FA] px-4 py-3"
                          >
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-[#191F28]">
                                {m.title ?? "제목 없음"}
                              </span>
                              <StatusBadge tone="gray">
                                {isValidMaterialType(m.material_type)
                                  ? TYPE_LABELS[m.material_type]
                                  : m.material_type ?? "링크"}
                              </StatusBadge>
                              {m.file_url ? (
                                <a
                                  href={m.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="max-w-[240px] truncate font-mono text-[11px] text-[#3182F6] hover:underline"
                                >
                                  {m.file_url}
                                </a>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <button
                                onClick={() => startEditMaterial(m)}
                                className="h-8 rounded-lg bg-[#E8F3FF] px-3 text-xs font-extrabold text-[#3182F6] hover:bg-[#D0E9FF]"
                              >
                                수정
                              </button>
                              <button
                                onClick={() => void handleDeleteMaterial(m.id)}
                                className="h-8 rounded-lg bg-[#FFF5F5] px-3 text-xs font-extrabold text-[#F04452] hover:bg-[#FFE8E8]"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : null}

                  {/* 추가 폼 */}
                  {addFormLessonId === lesson.id ? (
                    <MaterialFormFields
                      form={addForm}
                      onChange={setAddForm}
                      onSubmit={() => void handleAddMaterial(lesson.id)}
                      onCancel={() => setAddFormLessonId(null)}
                      submitLabel="자료 추가"
                      isSubmitting={isSubmitting}
                    />
                  ) : null}
                </article>
              );
            })
          )}
        </section>
      ) : null}
    </div>
  );
}
