export type StudyStatus = "ongoing" | "scheduled" | "completed";

export type BadgeTone =
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "gray";

export type Material = {
  id: string;
  name: string;
  type: "pdf" | "sheet" | "link";
  href: string;
};

export type Lesson = {
  id: string;
  order: number;
  title: string;
  summary: string;
  status: "ready" | "uploaded" | "soon";
  hasNewVideo?: boolean;
  materials: Material[];
  assignment: {
    title: string;
    dueDate: string;
    submitStatus: "submitted" | "pending";
  };
};

export type Study = {
  id: string;
  title: string;
  subtitle: string;
  status: StudyStatus;
  totalLessons: number;
  completedLessons: number;
  latestUpdate: string;
  notice: string;
  lessons: Lesson[];
};

export type Application = {
  id: string;
  name: string;
  phone: string;
  studyId: string;
  studyTitle: string;
  paymentStatus: "paid" | "unpaid";
  approvalStatus: "approved" | "pending";
  chatInviteStatus: "invited" | "need_invite";
  createdAt: string;
};

export type Enrollment = {
  teacherName: string;
  studyName: string;
};

export type TeacherEnrollmentPreview = {
  teacherName: string;
  studies: string[];
};
