import { studies as mockStudies } from "@/lib/mock-data";
import { createClient } from "@/lib/supabase/server";
import type { Lesson, Material, Study } from "@/types";

type ProfileRow = {
  role: "admin" | "teacher" | null;
};

type StudyRow = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "ended" | null;
  lesson_count: number | null;
};

type LessonRow = {
  id: string;
  study_id: string;
  title: string;
  summary: string | null;
  lesson_order: number | null;
  status: "draft" | "published" | "ready" | null;
  is_published: boolean | null;
  video_url: string | null;
  feedback_video_url: string | null;
  assignment_title: string | null;
  assignment_note: string | null;
  assignment_due_date: string | null;
};

type MaterialRow = {
  id: string;
  lesson_id: string | null;
  study_id?: string | null;
  title: string | null;
  name: string | null;
  /** DB 컬럼 material_type (마이그레이션 후 사용) */
  material_type?: string | null;
  file_type: string | null;
  type: string | null;
  file_url: string | null;
  link_url: string | null;
  download_url: string | null;
  description?: string | null;
};

type EnrollmentRow = {
  study_id: string;
};

export type LessonPreview = {
  id: string;
  order: number;
  title: string;
  hasVideo: boolean;
  materialCount: number;
  isPublished: boolean;
};

export type StudySummary = {
  id: string;
  title: string;
  subtitle: string;
  status: Study["status"];
  completedLessons: number;
  totalLessons: number;
  latestUpdate: string;
};

export type StudyDetailData = {
  study: StudySummary & { notice: string };
  lessons: LessonPreview[];
  /** 전회차 공통 자료 (lesson_id = null) */
  studyMaterials: Material[];
};

export type LessonDetailData = {
  study: StudySummary;
  lesson: Lesson & {
    videoUrl: string | null;
    feedbackVideoUrl: string | null;
    assignmentNote?: string;
  };
  prevLessonId: string | null;
  nextLessonId: string | null;
  /** 전회차 공통 자료 (스터디 레벨) */
  studyMaterials: Material[];
};


function mapStudyStatus(value: StudyRow["status"]): Study["status"] {
  if (value === "active") return "ongoing";
  if (value === "ended") return "completed";
  return "scheduled";
}

function mapLessonStatus(value: LessonRow["status"], hasVideo: boolean): Lesson["status"] {
  if (hasVideo || value === "published") return "uploaded";
  if (value === "ready") return "ready";
  return "soon";
}

function mapDbToMaterialType(
  materialType: string | null | undefined,
  fileType: string | null,
  legacyType: string | null,
): Material["materialType"] {
  const raw = (materialType ?? fileType ?? legacyType ?? "").toLowerCase();
  if (raw === "pdf") return "pdf";
  if (
    raw === "image" ||
    raw === "img" ||
    raw === "png" ||
    raw === "jpg" ||
    raw === "jpeg" ||
    raw === "gif" ||
    raw === "webp"
  ) {
    return "image";
  }
  if (raw === "other") return "other";
  return "link";
}

function mapMaterialRow(item: MaterialRow, index: number): Material {
  return {
    id: item.id || `m-${index + 1}`,
    title: item.title ?? item.name ?? "자료",
    fileUrl: item.file_url ?? item.link_url ?? item.download_url ?? "#",
    materialType: mapDbToMaterialType(item.material_type, item.file_type, item.type),
    description: item.description || undefined,
  };
}

function formatDateLabel(input: string | null) {
  if (!input) return "미정";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return input;
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일`;
}

function buildMockSummaries() {
  return mockStudies.map((study) => ({
    id: study.id,
    title: study.title,
    subtitle: study.subtitle,
    status: study.status,
    completedLessons: study.completedLessons,
    totalLessons: study.totalLessons,
    latestUpdate: study.latestUpdate,
  }));
}

async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, role: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<ProfileRow>();

  return { supabase, user, role: profile?.role ?? "teacher" };
}

async function getAllowedStudyIds(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("study_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .returns<EnrollmentRow[]>();

  return new Set((data ?? []).map((item) => item.study_id));
}

export async function getDashboardStudies() {
  const { supabase, user, role } = await getViewer();

  if (!user) return [];

  const { data: dbStudies, error } = await supabase
    .from("studies")
    .select("id, title, description, status, lesson_count")
    .order("created_at", { ascending: false })
    .returns<StudyRow[]>();

  if (error || !dbStudies) {
    return buildMockSummaries();
  }

  let studies = dbStudies;
  if (role !== "admin") {
    const allowedIds = await getAllowedStudyIds(user.id);
    studies = studies.filter((study) => allowedIds.has(study.id));
  }

  return studies.map((study) => ({
    id: study.id,
    title: study.title,
    subtitle: study.description ?? "스터디 상세에서 회차별 피드백을 확인할 수 있어요.",
    status: mapStudyStatus(study.status),
    completedLessons: 0,
    totalLessons: study.lesson_count ?? 0,
    latestUpdate: "스터디룸에서 최신 회차를 확인해 주세요.",
  }));
}

/** DB에 스터디가 존재하지만 현재 사용자에게 접근 권한이 없음을 나타내는 sentinel 값 */
export const UNAUTHORIZED = "unauthorized" as const;
export type StudyDetailResult = StudyDetailData | typeof UNAUTHORIZED | null;
export type LessonDetailResult = LessonDetailData | typeof UNAUTHORIZED | null;

export async function getStudyDetailForViewer(studyId: string): Promise<StudyDetailResult> {
  const { supabase, user, role } = await getViewer();
  if (!user) return null;

  // DB 조회를 먼저 수행 (enrollment 체크 전 — mock ID가 enrollment 체크에서 걸리는 문제 방지)
  const { data: studyRow, error: studyError } = await supabase
    .from("studies")
    .select("id, title, description, status, lesson_count")
    .eq("id", studyId)
    .maybeSingle<StudyRow>();

  // DB가 응답 불가거나 스터디가 없으면 → mock 데이터로 폴백 (enrollment 체크 불필요)
  if (studyError || !studyRow) {
    const mockStudy = mockStudies.find((item) => item.id === studyId);
    if (!mockStudy) return null;
    return {
      study: {
        id: mockStudy.id,
        title: mockStudy.title,
        subtitle: mockStudy.subtitle,
        status: mockStudy.status,
        completedLessons: mockStudy.completedLessons,
        totalLessons: mockStudy.totalLessons,
        latestUpdate: mockStudy.latestUpdate,
        notice: mockStudy.notice,
      },
      lessons: mockStudy.lessons.map((lesson) => ({
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        hasVideo: lesson.status === "uploaded",
        materialCount: lesson.materials.length,
        isPublished: lesson.status !== "soon",
      })),
      studyMaterials: [],
    };
  }

  // 실제 DB 스터디: admin이 아닌 경우 enrollment 체크
  if (role !== "admin") {
    const allowedIds = await getAllowedStudyIds(user.id);
    if (!allowedIds.has(studyId)) return UNAUTHORIZED;
  }

  // 전회차 공통 자료 (lesson_id IS NULL)
  const { data: studyMatRows } = await supabase
    .from("materials")
    .select("*")
    .eq("study_id", studyId)
    .is("lesson_id", null)
    .returns<MaterialRow[]>();

  const studyMaterials: Material[] = (studyMatRows ?? []).map(mapMaterialRow);

  const { data: lessonRows } = await supabase
    .from("lessons")
    .select(
      "id, study_id, title, summary, lesson_order, status, is_published, video_url, feedback_video_url, assignment_title, assignment_note, assignment_due_date",
    )
    .eq("study_id", studyId)
    .order("lesson_order", { ascending: true })
    .returns<LessonRow[]>();

  const lessonIds = (lessonRows ?? []).map((lesson) => lesson.id);
  const materialCountMap = new Map<string, number>();

  if (lessonIds.length > 0) {
    const { data: materials } = await supabase
      .from("materials")
      .select("id, lesson_id")
      .in("lesson_id", lessonIds)
      .not("lesson_id", "is", null)
      .returns<Array<Pick<MaterialRow, "id" | "lesson_id">>>();

    for (const material of materials ?? []) {
      if (!material.lesson_id) continue;
      const current = materialCountMap.get(material.lesson_id) ?? 0;
      materialCountMap.set(material.lesson_id, current + 1);
    }
  }

  const previews: LessonPreview[] = (lessonRows ?? []).map((lesson, index) => {
    const hasVideo = Boolean(lesson.feedback_video_url || lesson.video_url);
    return {
      id: lesson.id,
      order: lesson.lesson_order ?? index + 1,
      title: lesson.title,
      hasVideo,
      materialCount: materialCountMap.get(lesson.id) ?? 0,
      isPublished: lesson.is_published ?? hasVideo,
    };
  });

  const completedLessons = previews.filter((lesson) => lesson.hasVideo).length;
  const latestWithVideo = [...previews].reverse().find((item) => item.hasVideo);

  return {
    study: {
      id: studyRow.id,
      title: studyRow.title,
      subtitle: studyRow.description ?? "회차별 피드백과 자료를 확인해 보세요.",
      status: mapStudyStatus(studyRow.status),
      completedLessons,
      totalLessons: studyRow.lesson_count ?? previews.length,
      latestUpdate: latestWithVideo
        ? `${latestWithVideo.order}회차 피드백 영상 확인 가능`
        : "첫 회차 준비 중",
      notice: "회차별 피드백 영상과 자료를 순서대로 확인해 주세요.",
    },
    lessons: previews,
    studyMaterials,
  };
}

export async function getLessonDetailForViewer(
  studyId: string,
  lessonId: string,
): Promise<LessonDetailResult> {
  const studyDetailResult = await getStudyDetailForViewer(studyId);
  if (studyDetailResult === null) return null;
  if (studyDetailResult === UNAUTHORIZED) return UNAUTHORIZED;
  const studyDetail = studyDetailResult;

  const { supabase } = await getViewer();
  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .select(
      "id, study_id, title, summary, lesson_order, status, is_published, video_url, feedback_video_url, assignment_title, assignment_note, assignment_due_date",
    )
    .eq("study_id", studyId)
    .eq("id", lessonId)
    .maybeSingle<LessonRow>();

  const { data: materialRows } = await supabase
    .from("materials")
    .select("*")
    .eq("lesson_id", lessonId)
    .returns<MaterialRow[]>();

  let mappedLesson: LessonDetailData["lesson"] | null = null;

  if (!lessonError && lessonRow) {
    const hasVideo = Boolean(lessonRow.feedback_video_url || lessonRow.video_url);
    const materials: Material[] = (materialRows ?? []).map(mapMaterialRow);

    mappedLesson = {
      id: lessonRow.id,
      order: lessonRow.lesson_order ?? 1,
      title: lessonRow.title,
      summary: lessonRow.summary ?? "이번 회차 피드백을 확인해 주세요.",
      status: mapLessonStatus(lessonRow.status, hasVideo),
      hasNewVideo: hasVideo,
      materials,
      assignment: {
        title: lessonRow.assignment_title ?? "회차 안내를 확인해 주세요.",
        dueDate: formatDateLabel(lessonRow.assignment_due_date),
        submitStatus: "pending",
      },
      assignmentNote: lessonRow.assignment_note ?? "제출 전 체크리스트를 확인해 주세요.",
      videoUrl: lessonRow.video_url,
      feedbackVideoUrl: lessonRow.feedback_video_url,
    };
  } else {
    const mockStudy = mockStudies.find((item) => item.id === studyId);
    const mockLesson = mockStudy?.lessons.find((item) => item.id === lessonId);
    if (!mockStudy || !mockLesson) return null;
    mappedLesson = {
      ...mockLesson,
      videoUrl: mockLesson.status === "uploaded" ? "#" : null,
      feedbackVideoUrl: null,
      assignmentNote: "회차별 과제를 제출하고 다음 피드백 영상을 준비해 주세요.",
    };
  }

  const sortedLessons = [...studyDetail.lessons].sort((a, b) => a.order - b.order);
  const currentIdx = sortedLessons.findIndex((item) => item.id === lessonId);
  const prevLessonId = currentIdx > 0 ? sortedLessons[currentIdx - 1].id : null;
  const nextLessonId =
    currentIdx >= 0 && currentIdx < sortedLessons.length - 1
      ? sortedLessons[currentIdx + 1].id
      : null;

  return {
    study: studyDetail.study,
    lesson: mappedLesson,
    prevLessonId,
    nextLessonId,
    studyMaterials: studyDetail.studyMaterials,
  };
}
