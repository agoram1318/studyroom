"use client";

import { useCallback, useEffect, useState } from "react";
import { extractGoogleDriveFileId } from "@/lib/google-drive";
import { Button } from "@/components/common/Button";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { createClient } from "@/lib/supabase/client";

// ── Types ─────────────────────────────────────────────────────────────────────

type StudyOption = { id: string; title: string };

type AdminLesson = {
  id: string;
  study_id: string;
  title: string;
  lesson_order: number | null;
  summary: string | null;
};

type AdminMaterial = {
  id: string;
  lesson_id: string | null;
  study_id: string | null;
  title: string | null;
  material_type: string | null;
  file_url: string | null;
  description: string | null;
};

type MatType = "pdf" | "image" | "link" | "other";

type MatForm = {
  title: string;
  material_type: MatType;
  file_url: string;
  description: string;
};

type LessonForm = {
  title: string;
  lesson_order: number;
  summary: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const EMPTY_MAT: MatForm = { title: "", material_type: "pdf", file_url: "", description: "" };
const EMPTY_LESSON: LessonForm = { title: "", lesson_order: 1, summary: "" };
const MAT_LABELS: Record<MatType, string> = { pdf: "PDF", image: "이미지", link: "링크", other: "기타" };

function isValidMatType(v: string | null | undefined): v is MatType {
  return v === "pdf" || v === "image" || v === "link" || v === "other";
}
function matToForm(m: AdminMaterial): MatForm {
  return {
    title: m.title ?? "",
    material_type: isValidMatType(m.material_type) ? m.material_type : "link",
    file_url: m.file_url ?? "",
    description: m.description ?? "",
  };
}
function lessonToForm(l: AdminLesson): LessonForm {
  return {
    title: l.title,
    lesson_order: l.lesson_order ?? 1,
    summary: l.summary ?? "",
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function DriveIdHint({ url }: { url: string }) {
  if (!url) return null;
  const id = extractGoogleDriveFileId(url);
  return (
    <p className={`mt-1 font-mono text-[11px] ${id ? "text-[#3182F6]" : "text-[#F04452]"}`}>
      {id ? `✓ 파일 ID: ${id}` : "✕ 파일 ID를 찾을 수 없어요 (보기 전용)"}
    </p>
  );
}

function MatFormFields({
  form,
  onChange,
  onSubmit,
  onCancel,
  label,
  disabled,
}: {
  form: MatForm;
  onChange: (f: MatForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  label: string;
  disabled: boolean;
}) {
  return (
    <div className="mt-3 rounded-2xl border border-[#D7E6FB] bg-[#F0F7FF] p-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input
          value={form.title}
          onChange={(e) => onChange({ ...form, title: e.target.value })}
          placeholder="자료명 *"
          className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6]"
        />
        <select
          value={form.material_type}
          onChange={(e) => onChange({ ...form, material_type: e.target.value as MatType })}
          className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-bold text-[#4E5968] outline-none focus:border-[#3182F6]"
        >
          <option value="pdf">PDF</option>
          <option value="image">이미지</option>
          <option value="link">링크</option>
          <option value="other">기타</option>
        </select>
        <div className="sm:col-span-2">
          <input
            value={form.file_url}
            onChange={(e) => onChange({ ...form, file_url: e.target.value })}
            placeholder="구글드라이브 공유 링크 *"
            className="h-10 w-full rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6]"
          />
          <DriveIdHint url={form.file_url} />
        </div>
        <input
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="설명 (선택)"
          className="h-10 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6] sm:col-span-2"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={onSubmit} disabled={disabled} className="h-9 px-4 text-xs">
          {disabled ? "저장 중..." : label}
        </Button>
        <Button variant="secondary" onClick={onCancel} className="h-9 px-4 text-xs">
          취소
        </Button>
      </div>
    </div>
  );
}

function MatRow({
  m,
  onEdit,
  onDelete,
}: {
  m: AdminMaterial;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-[#F7F8FA] px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-[#191F28]">{m.title ?? "제목 없음"}</span>
          <StatusBadge tone="gray">
            {isValidMatType(m.material_type) ? MAT_LABELS[m.material_type] : "링크"}
          </StatusBadge>
        </div>
        {m.description ? (
          <p className="mt-0.5 text-xs text-[#6B7684]">{m.description}</p>
        ) : null}
        {m.file_url ? (
          <a
            href={m.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-0.5 block max-w-[300px] truncate font-mono text-[11px] text-[#3182F6] hover:underline"
          >
            {m.file_url}
          </a>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          onClick={onEdit}
          className="h-8 rounded-lg bg-[#E8F3FF] px-3 text-xs font-extrabold text-[#3182F6] hover:bg-[#D0E9FF]"
        >
          수정
        </button>
        <button
          onClick={onDelete}
          className="h-8 rounded-lg bg-[#FFF5F5] px-3 text-xs font-extrabold text-[#F04452] hover:bg-[#FFE8E8]"
        >
          삭제
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminLessonsPage() {
  // ─ common
  const [studies, setStudies] = useState<StudyOption[]>([]);
  const [selectedStudyId, setSelectedStudyId] = useState("");
  const [isLoadingStudies, setIsLoadingStudies] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ─ 전회차 자료
  const [studyMats, setStudyMats] = useState<AdminMaterial[]>([]);
  const [showSMForm, setShowSMForm] = useState(false);
  const [smForm, setSmForm] = useState<MatForm>(EMPTY_MAT);
  const [editingSMId, setEditingSMId] = useState<string | null>(null);
  const [smEditForm, setSmEditForm] = useState<MatForm>(EMPTY_MAT);

  // ─ 회차
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [lessonMatMap, setLessonMatMap] = useState<Record<string, AdminMaterial[]>>({});
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState<LessonForm>(EMPTY_LESSON);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonEditForm, setLessonEditForm] = useState<LessonForm>(EMPTY_LESSON);

  // ─ 회차별 자료
  const [addLMId, setAddLMId] = useState<string | null>(null);
  const [lmAddForm, setLmAddForm] = useState<MatForm>(EMPTY_MAT);
  const [editingLMId, setEditingLMId] = useState<string | null>(null);
  const [lmEditForm, setLmEditForm] = useState<MatForm>(EMPTY_MAT);

  // ── Load studies ──────────────────────────────────────────────────────────────
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

  // ── Load study data ───────────────────────────────────────────────────────────
  const loadData = useCallback(async (studyId: string) => {
    setIsLoadingData(true);
    setStudyMats([]);
    setLessons([]);
    setLessonMatMap({});
    setShowSMForm(false);
    setShowLessonForm(false);
    setEditingLessonId(null);
    setAddLMId(null);
    setEditingSMId(null);
    setEditingLMId(null);

    const supabase = createClient();

    // 전회차 자료 (study_id = studyId AND lesson_id IS NULL)
    const { data: smData, error: smErr } = await supabase
      .from("materials")
      .select("id, lesson_id, study_id, title, material_type, file_url, description")
      .eq("study_id", studyId)
      .is("lesson_id", null)
      .returns<AdminMaterial[]>();

    if (smErr) {
      setError(
        smErr.message.includes("study_id")
          ? "마이그레이션 필요: materials 테이블에 study_id 컬럼이 없어요. 마이그레이션을 먼저 실행해 주세요."
          : smErr.message,
      );
    } else {
      setStudyMats(smData ?? []);
    }

    // 회차 목록
    const { data: lData, error: lErr } = await supabase
      .from("lessons")
      .select("id, study_id, title, lesson_order, summary")
      .eq("study_id", studyId)
      .order("lesson_order", { ascending: true })
      .returns<AdminLesson[]>();

    if (lErr) {
      setError(lErr.message);
      setIsLoadingData(false);
      return;
    }

    const lessonRows = lData ?? [];
    setLessons(lessonRows);

    if (lessonRows.length > 0) {
      const ids = lessonRows.map((l) => l.id);
      const { data: lmData } = await supabase
        .from("materials")
        .select("id, lesson_id, study_id, title, material_type, file_url, description")
        .in("lesson_id", ids)
        .returns<AdminMaterial[]>();

      const map: Record<string, AdminMaterial[]> = {};
      for (const m of lmData ?? []) {
        if (m.lesson_id) {
          if (!map[m.lesson_id]) map[m.lesson_id] = [];
          map[m.lesson_id].push(m);
        }
      }
      setLessonMatMap(map);
    }

    setIsLoadingData(false);
  }, []);

  useEffect(() => {
    if (selectedStudyId) {
      setError("");
      setMessage("");
      void loadData(selectedStudyId);
    }
  }, [selectedStudyId, loadData]);

  // ── Study material CRUD ───────────────────────────────────────────────────────
  const addStudyMat = async () => {
    if (!smForm.title.trim() || !smForm.file_url.trim()) {
      setError("자료명과 링크를 입력해 주세요.");
      return;
    }
    setError(""); setMessage(""); setIsSubmitting(true);
    const { error: e } = await createClient().from("materials").insert({
      study_id: selectedStudyId,
      lesson_id: null,
      title: smForm.title.trim(),
      material_type: smForm.material_type,
      file_url: smForm.file_url.trim(),
      description: smForm.description.trim() || null,
    });
    if (e) { setError(e.message); setIsSubmitting(false); return; }
    setMessage("전회차 자료를 추가했습니다.");
    setShowSMForm(false);
    setSmForm(EMPTY_MAT);
    await loadData(selectedStudyId);
    setIsSubmitting(false);
  };

  const updateStudyMat = async (id: string) => {
    if (!smEditForm.title.trim() || !smEditForm.file_url.trim()) {
      setError("자료명과 링크를 입력해 주세요.");
      return;
    }
    setError(""); setMessage(""); setIsSubmitting(true);
    const { error: e } = await createClient().from("materials")
      .update({
        title: smEditForm.title.trim(),
        material_type: smEditForm.material_type,
        file_url: smEditForm.file_url.trim(),
        description: smEditForm.description.trim() || null,
      })
      .eq("id", id);
    if (e) { setError(e.message); setIsSubmitting(false); return; }
    setMessage("전회차 자료를 수정했습니다.");
    setEditingSMId(null);
    await loadData(selectedStudyId);
    setIsSubmitting(false);
  };

  const deleteStudyMat = async (id: string) => {
    if (!window.confirm("이 전회차 자료를 삭제할까요?")) return;
    setError(""); setMessage("");
    const { error: e } = await createClient().from("materials").delete().eq("id", id);
    if (e) { setError(e.message); return; }
    setMessage("전회차 자료를 삭제했습니다.");
    await loadData(selectedStudyId);
  };

  // ── Lesson CRUD ───────────────────────────────────────────────────────────────
  const addLesson = async () => {
    if (!lessonForm.title.trim()) {
      setError("회차 제목을 입력해 주세요.");
      return;
    }
    setError(""); setMessage(""); setIsSubmitting(true);
    const { error: e } = await createClient().from("lessons").insert({
      study_id: selectedStudyId,
      title: lessonForm.title.trim(),
      lesson_order: lessonForm.lesson_order,
      summary: lessonForm.summary.trim() || null,
    });
    if (e) { setError(e.message); setIsSubmitting(false); return; }
    setMessage(`${lessonForm.lesson_order}회차를 추가했습니다.`);
    setShowLessonForm(false);
    setLessonForm(EMPTY_LESSON);
    await loadData(selectedStudyId);
    setIsSubmitting(false);
  };

  const updateLesson = async (id: string) => {
    if (!lessonEditForm.title.trim()) {
      setError("회차 제목을 입력해 주세요.");
      return;
    }
    setError(""); setMessage(""); setIsSubmitting(true);
    const { error: e } = await createClient().from("lessons")
      .update({
        title: lessonEditForm.title.trim(),
        lesson_order: lessonEditForm.lesson_order,
        summary: lessonEditForm.summary.trim() || null,
      })
      .eq("id", id);
    if (e) { setError(e.message); setIsSubmitting(false); return; }
    setMessage("회차 정보를 수정했습니다.");
    setEditingLessonId(null);
    await loadData(selectedStudyId);
    setIsSubmitting(false);
  };

  const deleteLesson = async (id: string, order: number | null) => {
    if (!window.confirm(`${order ?? "?"}회차를 삭제할까요? 해당 회차의 자료도 함께 삭제됩니다.`)) return;
    setError(""); setMessage("");
    await createClient().from("materials").delete().eq("lesson_id", id);
    const { error: e } = await createClient().from("lessons").delete().eq("id", id);
    if (e) { setError(e.message); return; }
    setMessage("회차를 삭제했습니다.");
    await loadData(selectedStudyId);
  };

  // ── Lesson material CRUD ──────────────────────────────────────────────────────
  const addLessonMat = async (lessonId: string) => {
    if (!lmAddForm.title.trim() || !lmAddForm.file_url.trim()) {
      setError("자료명과 링크를 입력해 주세요.");
      return;
    }
    setError(""); setMessage(""); setIsSubmitting(true);
    const { error: e } = await createClient().from("materials").insert({
      study_id: selectedStudyId,
      lesson_id: lessonId,
      title: lmAddForm.title.trim(),
      material_type: lmAddForm.material_type,
      file_url: lmAddForm.file_url.trim(),
      description: lmAddForm.description.trim() || null,
    });
    if (e) { setError(e.message); setIsSubmitting(false); return; }
    setMessage("회차 자료를 추가했습니다.");
    setAddLMId(null);
    setLmAddForm(EMPTY_MAT);
    await loadData(selectedStudyId);
    setIsSubmitting(false);
  };

  const updateLessonMat = async (id: string) => {
    if (!lmEditForm.title.trim() || !lmEditForm.file_url.trim()) {
      setError("자료명과 링크를 입력해 주세요.");
      return;
    }
    setError(""); setMessage(""); setIsSubmitting(true);
    const { error: e } = await createClient().from("materials")
      .update({
        title: lmEditForm.title.trim(),
        material_type: lmEditForm.material_type,
        file_url: lmEditForm.file_url.trim(),
        description: lmEditForm.description.trim() || null,
      })
      .eq("id", id);
    if (e) { setError(e.message); setIsSubmitting(false); return; }
    setMessage("회차 자료를 수정했습니다.");
    setEditingLMId(null);
    await loadData(selectedStudyId);
    setIsSubmitting(false);
  };

  const deleteLessonMat = async (id: string) => {
    if (!window.confirm("이 자료를 삭제할까요?")) return;
    setError(""); setMessage("");
    const { error: e } = await createClient().from("materials").delete().eq("id", id);
    if (e) { setError(e.message); return; }
    setMessage("회차 자료를 삭제했습니다.");
    await loadData(selectedStudyId);
  };

  // ── Lesson form component ─────────────────────────────────────────────────────
  function LessonFormFields({
    form,
    onChange,
    onSubmit,
    onCancel,
    label,
  }: {
    form: LessonForm;
    onChange: (f: LessonForm) => void;
    onSubmit: () => void;
    onCancel: () => void;
    label: string;
  }) {
    return (
      <div className="rounded-2xl border border-[#D7E6FB] bg-[#F0F7FF] p-4">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <div className="flex gap-2 sm:col-span-2">
            <input
              type="number"
              min={1}
              value={form.lesson_order}
              onChange={(e) => onChange({ ...form, lesson_order: Number(e.target.value) || 1 })}
              placeholder="순서"
              className="h-10 w-20 shrink-0 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6]"
            />
            <input
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="회차 제목 *"
              className="h-10 min-w-0 flex-1 rounded-xl border border-[#E5E8EB] bg-white px-3 text-sm font-semibold outline-none focus:border-[#3182F6]"
            />
          </div>
          <textarea
            value={form.summary}
            onChange={(e) => onChange({ ...form, summary: e.target.value })}
            placeholder="안내사항 (선택)"
            rows={2}
            className="rounded-xl border border-[#E5E8EB] bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-[#3182F6] sm:col-span-2"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={onSubmit} disabled={isSubmitting} className="h-9 px-4 text-xs">
            {isSubmitting ? "저장 중..." : label}
          </Button>
          <Button variant="secondary" onClick={onCancel} className="h-9 px-4 text-xs">
            취소
          </Button>
        </div>
      </div>
    );
  }

  // ── JSX ───────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader
        title="회차 자료 관리"
        description="전회차 공통 자료와 회차별 피드백 자료를 스터디별로 관리합니다."
      />

      {/* 구글드라이브 링크 안내 */}
      <section className="rounded-[22px] border border-[#D7E6FB] bg-[#E8F3FF] p-5">
        <p className="text-sm font-extrabold text-[#2E6FD1]">지원하는 구글드라이브 링크 형식</p>
        <ul className="mt-2 space-y-0.5 font-mono text-xs text-[#4E5968]">
          <li>· https://drive.google.com/file/d/FILE_ID/view?usp=sharing</li>
          <li>· https://drive.google.com/open?id=FILE_ID</li>
        </ul>
      </section>

      {/* 스터디 선택 */}
      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <h2 className="mb-3 text-base font-black tracking-[-0.03em] text-[#191F28]">스터디 선택</h2>
        {isLoadingStudies ? (
          <p className="text-sm text-[#6B7684]">불러오는 중...</p>
        ) : (
          <select
            value={selectedStudyId}
            onChange={(e) => {
              setSelectedStudyId(e.target.value);
              setError("");
              setMessage("");
            }}
            className="h-11 w-full max-w-sm rounded-2xl border border-[#E5E8EB] px-4 text-sm font-bold text-[#4E5968] outline-none focus:border-[#3182F6]"
          >
            <option value="">-- 스터디를 선택하세요 --</option>
            {studies.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
        )}
      </section>

      {/* 오류 / 성공 */}
      {error ? (
        <p className="rounded-2xl bg-[#FFF5F5] px-4 py-3 text-sm font-semibold text-[#F04452]">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-2xl bg-[#F0FFF4] px-4 py-3 text-sm font-semibold text-[#1E8A4A]">{message}</p>
      ) : null}

      {/* 로딩 */}
      {selectedStudyId && isLoadingData ? (
        <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
          데이터를 불러오는 중...
        </p>
      ) : null}

      {selectedStudyId && !isLoadingData ? (
        <>
          {/* ── Section 1: 전회차 자료 ─────────────────────────────────────── */}
          <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-5 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
                  전회차 자료
                </h2>
                <p className="mt-1 text-sm text-[#6B7684]">
                  모든 회차에서 공통으로 볼 수 있는 자료입니다. (교재, 공지, 줌 링크 등)
                </p>
              </div>
              <Button
                variant={showSMForm ? "secondary" : "primary"}
                className="h-9 shrink-0 px-4 text-xs"
                onClick={() => {
                  setShowSMForm((p) => !p);
                  setSmForm(EMPTY_MAT);
                  setEditingSMId(null);
                  setError("");
                }}
              >
                {showSMForm ? "취소" : "+ 자료 추가"}
              </Button>
            </div>

            {showSMForm ? (
              <MatFormFields
                form={smForm}
                onChange={setSmForm}
                onSubmit={() => void addStudyMat()}
                onCancel={() => setShowSMForm(false)}
                label="자료 추가"
                disabled={isSubmitting}
              />
            ) : null}

            {studyMats.length === 0 && !showSMForm ? (
              <p className="mt-4 text-sm text-[#6B7684]">
                아직 등록된 전회차 자료가 없어요.
              </p>
            ) : (
              <div className="mt-4 grid gap-2">
                {studyMats.map((m) =>
                  editingSMId === m.id ? (
                    <MatFormFields
                      key={m.id}
                      form={smEditForm}
                      onChange={setSmEditForm}
                      onSubmit={() => void updateStudyMat(m.id)}
                      onCancel={() => setEditingSMId(null)}
                      label="수정 저장"
                      disabled={isSubmitting}
                    />
                  ) : (
                    <MatRow
                      key={m.id}
                      m={m}
                      onEdit={() => {
                        setEditingSMId(m.id);
                        setSmEditForm(matToForm(m));
                        setShowSMForm(false);
                        setError("");
                      }}
                      onDelete={() => void deleteStudyMat(m.id)}
                    />
                  ),
                )}
              </div>
            )}
          </section>

          {/* ── Section 2: 회차별 피드백 ──────────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
                회차별 피드백
              </h2>
              <Button
                variant={showLessonForm ? "secondary" : "primary"}
                className="h-9 shrink-0 px-4 text-xs"
                onClick={() => {
                  setShowLessonForm((p) => !p);
                  setLessonForm({ ...EMPTY_LESSON, lesson_order: lessons.length + 1 });
                  setError("");
                }}
              >
                {showLessonForm ? "취소" : "+ 회차 추가"}
              </Button>
            </div>

            {/* 회차 추가 폼 */}
            {showLessonForm ? (
              <LessonFormFields
                form={lessonForm}
                onChange={setLessonForm}
                onSubmit={() => void addLesson()}
                onCancel={() => setShowLessonForm(false)}
                label="회차 추가"
              />
            ) : null}

            {lessons.length === 0 && !showLessonForm ? (
              <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
                아직 등록된 회차가 없어요. 위 버튼으로 회차를 추가해 주세요.
              </p>
            ) : null}

            {/* 회차 카드 목록 */}
            {lessons.map((lesson) => {
              const lMats = lessonMatMap[lesson.id] ?? [];
              const isEditingThis = editingLessonId === lesson.id;

              return (
                <article
                  key={lesson.id}
                  className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)]"
                >
                  {isEditingThis ? (
                    <LessonFormFields
                      form={lessonEditForm}
                      onChange={setLessonEditForm}
                      onSubmit={() => void updateLesson(lesson.id)}
                      onCancel={() => setEditingLessonId(null)}
                      label="수정 저장"
                    />
                  ) : (
                    <>
                      {/* 회차 헤더 */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge tone="blue">{lesson.lesson_order ?? "?"}회차</StatusBadge>
                          <span className="text-base font-black tracking-[-0.03em] text-[#191F28]">
                            {lesson.title}
                          </span>
                          <StatusBadge tone={lMats.length > 0 ? "yellow" : "gray"}>
                            자료 {lMats.length}개
                          </StatusBadge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setEditingLessonId(lesson.id);
                              setLessonEditForm(lessonToForm(lesson));
                              setAddLMId(null);
                              setError("");
                            }}
                            className="h-8 rounded-lg bg-[#F2F4F6] px-3 text-xs font-extrabold text-[#191F28] hover:bg-[#E9EDF0]"
                          >
                            회차 수정
                          </button>
                          <button
                            onClick={() => {
                              if (addLMId === lesson.id) {
                                setAddLMId(null);
                              } else {
                                setAddLMId(lesson.id);
                                setLmAddForm(EMPTY_MAT);
                                setEditingLMId(null);
                                setError("");
                              }
                            }}
                            className="h-8 rounded-lg bg-[#E8F3FF] px-3 text-xs font-extrabold text-[#3182F6] hover:bg-[#D0E9FF]"
                          >
                            {addLMId === lesson.id ? "취소" : "+ 자료 추가"}
                          </button>
                          <button
                            onClick={() => void deleteLesson(lesson.id, lesson.lesson_order)}
                            className="h-8 rounded-lg bg-[#FFF5F5] px-3 text-xs font-extrabold text-[#F04452] hover:bg-[#FFE8E8]"
                          >
                            회차 삭제
                          </button>
                        </div>
                      </div>

                      {/* 안내사항 요약 */}
                      {lesson.summary ? (
                        <p className="mt-2 text-sm text-[#6B7684]">{lesson.summary}</p>
                      ) : null}
                    </>
                  )}

                  {/* 자료 없음 */}
                  {lMats.length === 0 && addLMId !== lesson.id && !isEditingThis ? (
                    <p className="mt-3 text-sm text-[#6B7684]">
                      아직 등록된 피드백 자료가 없어요.
                    </p>
                  ) : null}

                  {/* 자료 목록 */}
                  {lMats.length > 0 ? (
                    <div className="mt-3 grid gap-2">
                      {lMats.map((m) =>
                        editingLMId === m.id ? (
                          <MatFormFields
                            key={m.id}
                            form={lmEditForm}
                            onChange={setLmEditForm}
                            onSubmit={() => void updateLessonMat(m.id)}
                            onCancel={() => setEditingLMId(null)}
                            label="수정 저장"
                            disabled={isSubmitting}
                          />
                        ) : (
                          <MatRow
                            key={m.id}
                            m={m}
                            onEdit={() => {
                              setEditingLMId(m.id);
                              setLmEditForm(matToForm(m));
                              setAddLMId(null);
                            }}
                            onDelete={() => void deleteLessonMat(m.id)}
                          />
                        ),
                      )}
                    </div>
                  ) : null}

                  {/* 자료 추가 폼 */}
                  {addLMId === lesson.id ? (
                    <MatFormFields
                      form={lmAddForm}
                      onChange={setLmAddForm}
                      onSubmit={() => void addLessonMat(lesson.id)}
                      onCancel={() => setAddLMId(null)}
                      label="자료 추가"
                      disabled={isSubmitting}
                    />
                  ) : null}
                </article>
              );
            })}
          </section>
        </>
      ) : null}
    </div>
  );
}
