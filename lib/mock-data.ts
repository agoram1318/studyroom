import type { Application, Enrollment, Study } from "@/types";

export const studies: Study[] = [
  {
    id: "mid2-final",
    title: "중2 1학기 기말 내신대비 스터디",
    subtitle: "학교별 기말 출제 패턴과 피드백 중심",
    status: "ongoing",
    totalLessons: 5,
    completedLessons: 3,
    latestUpdate: "3회차 피드백 영상 업로드",
    notice:
      "3회차 피드백 영상이 업로드되었어요. 4회차 과제 제출은 5월 12일까지입니다.",
    lessons: [
      {
        id: "l1",
        order: 1,
        title: "오리엔테이션",
        summary: "스터디 진행 방식과 과제 제출 기준 안내",
        status: "ready",
        materials: [
          { id: "m1", name: "OT 안내자료.pdf", type: "pdf", href: "#" },
        ],
        assignment: {
          title: "이번 학기 출제 범위 정리",
          dueDate: "5월 3일",
          submitStatus: "submitted",
        },
      },
      {
        id: "l2",
        order: 2,
        title: "학교별 시험지 분석법",
        summary: "학교별 출제 패턴 분석 및 예상문항 설계",
        status: "ready",
        materials: [
          { id: "m2", name: "시험지 분석 템플릿.xlsx", type: "sheet", href: "#" },
          { id: "m3", name: "학교별 기출 묶음.pdf", type: "pdf", href: "#" },
        ],
        assignment: {
          title: "예상문항 3개 작성",
          dueDate: "5월 7일",
          submitStatus: "submitted",
        },
      },
      {
        id: "l3",
        order: 3,
        title: "피드백 강의",
        summary: "과제 공통 오류와 보완 포인트 정리",
        status: "uploaded",
        hasNewVideo: true,
        materials: [
          { id: "m4", name: "3회차 피드백 정리본.pdf", type: "pdf", href: "#" },
          { id: "m5", name: "학교별 변형문항 예시.pdf", type: "pdf", href: "#" },
          { id: "m6", name: "기말대비 체크리스트.xlsx", type: "sheet", href: "#" },
        ],
        assignment: {
          title: "학교별 예상문항 5개 제작",
          dueDate: "5월 12일",
          submitStatus: "pending",
        },
      },
      {
        id: "l4",
        order: 4,
        title: "실전 적용",
        summary: "문항 구성 실전 적용",
        status: "soon",
        materials: [],
        assignment: {
          title: "실전 풀이안 작성",
          dueDate: "5월 19일",
          submitStatus: "pending",
        },
      },
      {
        id: "l5",
        order: 5,
        title: "마무리 Q&A",
        summary: "최종 점검 및 질의응답",
        status: "soon",
        materials: [],
        assignment: {
          title: "최종 오답노트 제출",
          dueDate: "5월 26일",
          submitStatus: "pending",
        },
      },
    ],
  },
  {
    id: "high1-math",
    title: "고1 수학 상 실전문항 스터디",
    subtitle: "5월 15일 시작 예정",
    status: "scheduled",
    totalLessons: 4,
    completedLessons: 0,
    latestUpdate: "오픈 준비 중",
    notice: "시작 전 사전과제 안내가 곧 업로드됩니다.",
    lessons: [],
  },
  {
    id: "baekmi-review",
    title: "백미 활용 스터디",
    subtitle: "전체 회차 다시보기 가능",
    status: "completed",
    totalLessons: 5,
    completedLessons: 5,
    latestUpdate: "종료",
    notice: "전체 회차 다시보기와 자료 다운로드가 가능합니다.",
    lessons: [],
  },
];

export const applications: Application[] = [
  {
    id: "a1",
    name: "김OO 선생님",
    phone: "010-1234-5678",
    studyId: "mid2-final",
    studyTitle: "중2 1학기 기말 내신대비 스터디",
    paymentStatus: "unpaid",
    approvalStatus: "pending",
    chatInviteStatus: "need_invite",
    createdAt: "2026-05-04",
  },
  {
    id: "a2",
    name: "박OO 선생님",
    phone: "010-9876-1234",
    studyId: "high1-math",
    studyTitle: "고1 수학 상 실전문항 스터디",
    paymentStatus: "paid",
    approvalStatus: "approved",
    chatInviteStatus: "need_invite",
    createdAt: "2026-05-03",
  },
  {
    id: "a3",
    name: "이OO 선생님",
    phone: "010-5555-1212",
    studyId: "baekmi-review",
    studyTitle: "백미 활용 스터디",
    paymentStatus: "paid",
    approvalStatus: "approved",
    chatInviteStatus: "invited",
    createdAt: "2026-05-02",
  },
];

export const existingTeachers = ["권용운9778", "김OO 선생님", "박OO 선생님"];

export const existingStudyCatalog = [
  "중등 22",
  "중등 23",
  "중등 24",
  "중등 25",
  "고등 11",
];

export const existingEnrollments: Enrollment[] = [
  { teacherName: "김OO 선생님", studyName: "중등 22" },
  { teacherName: "김OO 선생님", studyName: "중등 23" },
  { teacherName: "박OO 선생님", studyName: "고등 11" },
  { teacherName: "권용운9778", studyName: "중등 24" },
];
