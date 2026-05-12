import { studies as mockStudies } from "@/lib/mock-data";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Lesson, Material, Study } from "@/types";

type ProfileRow = {
  role: "admin" | "teacher" | null;
  name: string | null;
};

type StudyRow = {
  id: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "ended" | null;
  lesson_count: number | null;
};

/**
 * lessons 테이블 스키마:
 * id, study_id, lesson_order, title, description, summary,
 * video_url, feedback_video_url, is_open, is_published, status,
 * assignment_title, created_at
 */
type LessonRow = {
  id: string;
  study_id: string;
  lesson_order: number | null;
  title: string;
  description: string | null;
  summary: string | null;
  video_url: string | null;
  feedback_video_url: string | null;
  is_open: boolean | null;
  is_published: boolean | null;
  status: string | null;
  assignment_title: string | null;
  created_at: string;
};

/**
 * materials 테이블 스키마:
 * id, study_id, lesson_id, title, file_url, material_type, description, created_at
 */
type MaterialRow = {
  id: string;
  study_id: string | null;
  lesson_id: string | null;
  title: string | null;
  file_url: string | null;
  material_type: string | null;
  description: string | null;
  created_at: string;
};

type EnrollmentRow = {
  study_id: string;
};

export type LessonPreview = {
  id: string;
  order: number;
  title: string;
  summary: string | null;
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

export type RecentMaterial = {
  id: string;
  title: string;
  studyId: string;
  studyTitle: string;
  /** null → "전회차 자료", number → "{n}회차" */
  lessonOrder: number | null;
  lessonLabel: string;
};

export type StudyDetailData = {
  study: StudySummary & { notice: string };
  lessons: LessonPreview[];
  /** 전회차 공통 자료 (lesson_id = null) */
  studyMaterials: Material[];
  /** 회차별 자료 맵 (lesson.id → Material[]) */
  lessonMaterials: Record<string, Material[]>;
  /** 데이터 조회 중 발생한 에러 메시지 */
  queryError?: string;
};

export type LessonDetailData = {
  study: StudySummary;
  lesson: Lesson & {
    videoUrl: string | null;
    feedbackVideoUrl: string | null;
  };
  prevLessonId: string | null;
  nextLessonId: string | null;
  /** 전회차 공통 자료 (스터디 레벨) */
  studyMaterials: Material[];
};

// ── SELECT 문자열 상수 ─────────────────────────────────────────────────────────

const LESSON_FIELDS =
  "id, study_id, lesson_order, title, description, summary, video_url, feedback_video_url, is_open, is_published, status, assignment_title, created_at";

const MATERIAL_FIELDS =
  "id, study_id, lesson_id, title, file_url, material_type, description, created_at";

// ── 매핑 헬퍼 ─────────────────────────────────────────────────────────────────

function mapStudyStatus(value: StudyRow["status"]): Study["status"] {
  if (value === "active") return "ongoing";
  if (value === "ended") return "completed";
  return "scheduled";
}

function mapLessonStatus(
  value: string | null | undefined,
  hasVideo: boolean,
): Lesson["status"] {
  if (hasVideo || value === "closed") return "uploaded";
  if (value === "ready" || value === "open") return "ready";
  return "soon";
}

function mapDbToMaterialType(materialType: string | null | undefined): Material["materialType"] {
  const raw = (materialType ?? "").toLowerCase();
  if (raw === "pdf") return "pdf";
  if (["image", "img", "png", "jpg", "jpeg", "gif", "webp"].includes(raw)) return "image";
  if (raw === "other") return "other";
  return "link";
}

function mapMaterialRow(item: MaterialRow, index: number): Material {
  return {
    id: item.id || `m-${index + 1}`,
    title: item.title ?? "자료",
    fileUrl: item.file_url ?? "#",
    materialType: mapDbToMaterialType(item.material_type),
    description: item.description ?? undefined,
  };
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

// ── 인증 헬퍼 ─────────────────────────────────────────────────────────────────

async function getViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, role: null, name: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .single<ProfileRow>();

  return {
    supabase,
    user,
    role: profile?.role ?? ("teacher" as const),
    name: profile?.name?.trim() ?? null,
  };
}

// ── 단일 회차 조회 헬퍼 (admin client, RLS 우회) ──────────────────────────────

async function queryLesson(
  studyId: string,
  lessonId: string,
): Promise<{ row: LessonRow | null; error?: string }> {
  const db = createAdminClient();

  const { data, error } = await db
    .from("lessons")
    .select(LESSON_FIELDS)
    .eq("study_id", studyId)
    .eq("id", lessonId)
    .maybeSingle<LessonRow>();

  if (error) {
    return { row: null, error: error.message };
  }
  return { row: data };
}

// ── 최근 자료 빌드 헬퍼 ──────────────────────────────────────────────────────

type LessonOrderRow = { id: string; lesson_order: number | null };

async function buildRecentMaterials(
  db: ReturnType<typeof createAdminClient>,
  materials: MaterialRow[],
  studyMap: Map<string, string>,
): Promise<RecentMaterial[]> {
  if (materials.length === 0) return [];

  // lesson_id 목록 수집 → 한 번만 조회
  const lessonIds = [
    ...new Set(materials.filter((m) => m.lesson_id).map((m) => m.lesson_id as string)),
  ];

  const lessonOrderMap = new Map<string, number>();
  if (lessonIds.length > 0) {
    const { data: lessonRows } = await db
      .from("lessons")
      .select("id, lesson_order")
      .in("id", lessonIds)
      .returns<LessonOrderRow[]>();

    for (const row of lessonRows ?? []) {
      if (row.lesson_order !== null) {
        lessonOrderMap.set(row.id, row.lesson_order);
      }
    }
  }

  return materials
    .filter((m) => m.study_id && studyMap.has(m.study_id))
    .map((m) => {
      const lessonOrder = m.lesson_id ? (lessonOrderMap.get(m.lesson_id) ?? null) : null;
      return {
        id: m.id,
        title: m.title ?? "자료",
        studyId: m.study_id!,
        studyTitle: studyMap.get(m.study_id!) ?? "스터디",
        lessonOrder,
        lessonLabel: lessonOrder !== null ? `${lessonOrder}회차` : "전회차 자료",
      };
    });
}

// ── 스터디 행 → 요약 변환 헬퍼 ───────────────────────────────────────────────

function mapStudyRowsToSummaries(rows: StudyRow[]): StudySummary[] {
  return rows.map((study) => ({
    id: study.id,
    title: study.title,
    subtitle: study.description ?? "스터디 상세에서 회차별 피드백을 확인할 수 있어요.",
    status: mapStudyStatus(study.status),
    completedLessons: 0,
    totalLessons: study.lesson_count ?? 0,
    latestUpdate: "스터디룸에서 최신 회차를 확인해 주세요.",
  }));
}

// ── 공개 함수 ─────────────────────────────────────────────────────────────────

export type DashboardData = {
  studies: StudySummary[];
  teacherName: string | null;
  recentMaterials: RecentMaterial[];
};

export async function getDashboardStudies(): Promise<DashboardData> {
  const { supabase, user, role, name } = await getViewer();

  if (!user) return { studies: [], teacherName: null, recentMaterials: [] };

  const db = createAdminClient();

  if (role === "admin") {
    // admin: 전체 스터디 + 전체 최신 자료(limit 10)를 병렬 조회
    const [studiesResult, materialsResult] = await Promise.all([
      supabase
        .from("studies")
        .select("id, title, description, status, lesson_count")
        .order("created_at", { ascending: false })
        .returns<StudyRow[]>(),
      db
        .from("materials")
        .select(MATERIAL_FIELDS)
        .order("created_at", { ascending: false })
        .limit(10)
        .returns<MaterialRow[]>(),
    ]);

    if (studiesResult.error || !studiesResult.data) {
      return { studies: buildMockSummaries(), teacherName: name, recentMaterials: [] };
    }

    const studyMap = new Map(studiesResult.data.map((s) => [s.id, s.title]));
    const recentMaterials = await buildRecentMaterials(db, materialsResult.data ?? [], studyMap);

    return {
      studies: mapStudyRowsToSummaries(studiesResult.data),
      teacherName: name,
      recentMaterials,
    };
  }

  // teacher: studies + enrollments 병렬 조회
  const [studiesResult, enrollmentsResult] = await Promise.all([
    supabase
      .from("studies")
      .select("id, title, description, status, lesson_count")
      .order("created_at", { ascending: false })
      .returns<StudyRow[]>(),
    supabase
      .from("enrollments")
      .select("study_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .returns<EnrollmentRow[]>(),
  ]);

  if (studiesResult.error || !studiesResult.data) {
    return { studies: buildMockSummaries(), teacherName: name, recentMaterials: [] };
  }

  const allowedIds = new Set((enrollmentsResult.data ?? []).map((e) => e.study_id));
  const filtered = studiesResult.data.filter((study) => allowedIds.has(study.id));
  const studyMap = new Map(filtered.map((s) => [s.id, s.title]));

  // 허용된 study_id로 최신 자료 조회
  let recentMaterials: RecentMaterial[] = [];
  const allowedIdsArray = [...allowedIds];
  if (allowedIdsArray.length > 0) {
    const { data: materialsData } = await db
      .from("materials")
      .select(MATERIAL_FIELDS)
      .in("study_id", allowedIdsArray)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<MaterialRow[]>();

    recentMaterials = await buildRecentMaterials(db, materialsData ?? [], studyMap);
  }

  return {
    studies: mapStudyRowsToSummaries(filtered),
    teacherName: name,
    recentMaterials,
  };
}

/** DB에 스터디가 존재하지만 현재 사용자에게 접근 권한이 없음을 나타내는 sentinel 값 */
export const UNAUTHORIZED = "unauthorized" as const;
export type StudyDetailResult = StudyDetailData | typeof UNAUTHORIZED | null;
export type LessonDetailResult = LessonDetailData | typeof UNAUTHORIZED | null;

export async function getStudyDetailForViewer(studyId: string): Promise<StudyDetailResult> {
  const { supabase, user, role } = await getViewer();
  if (!user) return null;

  // 1. 스터디 조회 (user client — studies RLS 체크)
  const { data: studyRow, error: studyError } = await supabase
    .from("studies")
    .select("id, title, description, status, lesson_count")
    .eq("id", studyId)
    .maybeSingle<StudyRow>();

  // DB에 없는 스터디(또는 오류) → mock 폴백
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
        summary: null,
        hasVideo: lesson.status === "uploaded",
        materialCount: lesson.materials.length,
        isPublished: lesson.status !== "soon",
      })),
      studyMaterials: [],
      lessonMaterials: {},
    };
  }

  // 2. admin client 준비 (RLS 우회 — 인증·권한은 이후 코드에서 완료)
  const db = createAdminClient();

  // 3. enrollment 확인(teacher만), 전회차 공통 자료, 회차 목록을 병렬로 조회
  const [enrollmentResult, studyMatResult, lessonsResult] = await Promise.all([
    role !== "admin"
      ? supabase
          .from("enrollments")
          .select("study_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .returns<EnrollmentRow[]>()
      : Promise.resolve({ data: null as EnrollmentRow[] | null, error: null }),
    db
      .from("materials")
      .select(MATERIAL_FIELDS)
      .eq("study_id", studyId)
      .is("lesson_id", null)
      .returns<MaterialRow[]>(),
    db
      .from("lessons")
      .select(LESSON_FIELDS)
      .eq("study_id", studyId)
      .order("lesson_order", { ascending: true })
      .returns<LessonRow[]>(),
  ]);

  // enrollment 체크 (admin은 건너뜀)
  if (role !== "admin") {
    const allowedIds = new Set((enrollmentResult.data ?? []).map((e) => e.study_id));
    if (!allowedIds.has(studyId)) return UNAUTHORIZED;
  }

  const studyMaterials: Material[] = (studyMatResult.data ?? []).map(mapMaterialRow);
  const lessonRows: LessonRow[] = lessonsResult.data ?? [];
  const lessonQueryError = lessonsResult.error?.message;
  const matError = studyMatResult.error;

  // 각 회차별 자료 개수 집계 + 자료 데이터 수집
  const lessonIds = lessonRows.map((lesson) => lesson.id);
  const materialCountMap = new Map<string, number>();
  const lessonMaterialsMap: Record<string, Material[]> = {};

  if (lessonIds.length > 0) {
    const { data: lessonMatRows } = await db
      .from("materials")
      .select(MATERIAL_FIELDS)
      .in("lesson_id", lessonIds)
      .not("lesson_id", "is", null)
      .returns<MaterialRow[]>();

    for (const [idx, row] of (lessonMatRows ?? []).entries()) {
      if (!row.lesson_id) continue;
      const current = materialCountMap.get(row.lesson_id) ?? 0;
      materialCountMap.set(row.lesson_id, current + 1);
      if (!lessonMaterialsMap[row.lesson_id]) lessonMaterialsMap[row.lesson_id] = [];
      lessonMaterialsMap[row.lesson_id].push(mapMaterialRow(row, idx));
    }
  }

  const previews: LessonPreview[] = lessonRows.map((lesson, index) => {
    const hasVideo = Boolean(lesson.feedback_video_url || lesson.video_url);
    return {
      id: lesson.id,
      order: lesson.lesson_order ?? index + 1,
      title: lesson.title,
      summary: lesson.summary,
      hasVideo,
      materialCount: materialCountMap.get(lesson.id) ?? 0,
      isPublished: lesson.is_published ?? false,
    };
  });

  const completedLessons = previews.filter((lesson) => lesson.hasVideo).length;
  const latestWithVideo = [...previews].reverse().find((item) => item.hasVideo);

  const errors: string[] = [];
  if (lessonQueryError) errors.push(`lessons: ${lessonQueryError}`);
  if (matError) errors.push(`materials: ${matError.message}`);

  return {
    study: {
      id: studyRow.id,
      title: studyRow.title,
      subtitle: studyRow.description ?? "회차별 피드백과 자료를 확인해 보세요.",
      status: mapStudyStatus(studyRow.status),
      completedLessons,
      totalLessons: previews.length,
      latestUpdate: latestWithVideo
        ? `${latestWithVideo.order}회차 피드백 영상 확인 가능`
        : previews.length > 0
          ? `${previews.length}개 회차 등록됨`
          : "첫 회차 준비 중",
      notice: "회차별 피드백 영상과 자료를 순서대로 확인해 주세요.",
    },
    lessons: previews,
    studyMaterials,
    lessonMaterials: lessonMaterialsMap,
    queryError: errors.length > 0 ? errors.join(" | ") : undefined,
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

  const { row: lessonRow, error: lessonQueryError } = await queryLesson(studyId, lessonId);

  const db = createAdminClient();
  const { data: materialRows } = await db
    .from("materials")
    .select(MATERIAL_FIELDS)
    .eq("lesson_id", lessonId)
    .returns<MaterialRow[]>();

  let mappedLesson: LessonDetailData["lesson"] | null = null;

  if (!lessonQueryError && lessonRow) {
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
        title: lessonRow.assignment_title,
        dueDate: "미정",
        submitStatus: "pending",
      },
      videoUrl: lessonRow.video_url,
      feedbackVideoUrl: lessonRow.feedback_video_url,
    };
  } else {
    // DB에서 못 찾은 경우 mock 폴백
    const mockStudy = mockStudies.find((item) => item.id === studyId);
    const mockLesson = mockStudy?.lessons.find((item) => item.id === lessonId);
    if (!mockStudy || !mockLesson) return null;
    mappedLesson = {
      ...mockLesson,
      videoUrl: mockLesson.status === "uploaded" ? "#" : null,
      feedbackVideoUrl: null,
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
