"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Enrollment, TeacherEnrollmentPreview } from "@/types";

type Props = {
  existingTeachers: string[];
  existingStudies: string[];
  existingEnrollments: Enrollment[];
};

type ParsedResult = {
  teachersInFile: string[];
  studiesInFile: string[];
  previewByTeacher: TeacherEnrollmentPreview[];
};

const TRUTHY_MARKERS = new Set(["O", "o", "ㅇ", "1", "TRUE", "Y"]);

function isTruthyCell(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim();
    return TRUTHY_MARKERS.has(normalized) || TRUTHY_MARKERS.has(normalized.toUpperCase());
  }
  return false;
}

function parseEnrollmentSheet(file: File): Promise<ParsedResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        if (!data) throw new Error("파일을 읽을 수 없습니다.");

        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) throw new Error("시트가 없습니다.");

        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
          worksheet,
          {
            header: 1,
            blankrows: false,
            defval: "",
          },
        );

        if (rows.length < 2) {
          throw new Error("최소 2행(헤더 + 데이터)이 필요합니다.");
        }

        const header = rows[0] ?? [];
        const studyNames = header
          .slice(1)
          .map((cell) => String(cell ?? "").trim())
          .filter((name) => name.length > 0);

        const previewByTeacher: TeacherEnrollmentPreview[] = [];
        const teacherSet = new Set<string>();

        rows.slice(1).forEach((row) => {
          const teacherName = String(row?.[0] ?? "").trim();
          if (!teacherName) return;

          teacherSet.add(teacherName);
          const assignedStudies: string[] = [];

          studyNames.forEach((study, index) => {
            const cellValue = row[index + 1];
            if (isTruthyCell(cellValue)) {
              assignedStudies.push(study);
            }
          });

          if (assignedStudies.length > 0) {
            previewByTeacher.push({ teacherName, studies: assignedStudies });
          }
        });

        resolve({
          teachersInFile: [...teacherSet],
          studiesInFile: studyNames,
          previewByTeacher,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "엑셀 파싱 중 오류가 발생했습니다.";
        reject(new Error(message));
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsArrayBuffer(file);
  });
}

export function EnrollmentImportPanel({
  existingTeachers,
  existingStudies,
  existingEnrollments,
}: Props) {
  const [fileName, setFileName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [appliedCount, setAppliedCount] = useState(0);

  const previewStats = useMemo(() => {
    if (!result) {
      return { newTeachers: 0, newStudies: 0, grantsToAdd: 0 };
    }

    const existingTeacherSet = new Set(existingTeachers);
    const existingStudySet = new Set(existingStudies);
    const existingEnrollmentSet = new Set(
      existingEnrollments.map((item) => `${item.teacherName}__${item.studyName}`),
    );

    let newTeachers = 0;
    result.teachersInFile.forEach((teacher) => {
      if (!existingTeacherSet.has(teacher)) newTeachers += 1;
    });

    let newStudies = 0;
    result.studiesInFile.forEach((study) => {
      if (!existingStudySet.has(study)) newStudies += 1;
    });

    let grantsToAdd = 0;
    result.previewByTeacher.forEach((item) => {
      item.studies.forEach((study) => {
        const key = `${item.teacherName}__${study}`;
        if (!existingEnrollmentSet.has(key)) grantsToAdd += 1;
      });
    });

    return { newTeachers, newStudies, grantsToAdd };
  }, [existingEnrollments, existingStudies, existingTeachers, result]);

  const handleUpload = async (file: File) => {
    setIsLoading(true);
    setError("");
    setAppliedCount(0);
    setFileName(file.name);
    try {
      const parsed = await parseEnrollmentSheet(file);
      setResult(parsed);
    } catch (uploadError) {
      setResult(null);
      setError(uploadError instanceof Error ? uploadError.message : "업로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
        <h2 className="text-xl font-black tracking-[-0.04em] text-[#191F28]">
          엑셀 파일 업로드
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#6B7684]">
          첫 행은 스터디명, 첫 열은 선생님명으로 인식합니다. O, o, ㅇ, 1, TRUE, Y 표시는
          권한 부여 대상으로 처리됩니다.
        </p>

        <div className="mt-4 rounded-2xl border border-dashed border-[#C8D1DB] bg-[#FBFCFD] p-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUpload(file);
            }}
            className="block w-full text-sm font-semibold text-[#4E5968] file:mr-4 file:rounded-xl file:border-0 file:bg-[#E8F3FF] file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-[#3182F6]"
          />
          {fileName ? (
            <p className="mt-2 text-xs font-semibold text-[#6B7684]">선택 파일: {fileName}</p>
          ) : null}
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm font-semibold text-[#3182F6]">파일을 분석 중입니다...</p>
        ) : null}
        {error ? <p className="mt-3 text-sm font-semibold text-[#F04452]">{error}</p> : null}
      </section>

      {result ? (
        <>
          <section className="grid gap-3 md:grid-cols-3">
            <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5">
              <p className="text-xs font-extrabold text-[#6B7684]">신규 선생님 수</p>
              <strong className="mt-2 block text-3xl font-black tracking-[-0.05em] text-[#191F28]">
                {previewStats.newTeachers}
              </strong>
            </article>
            <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5">
              <p className="text-xs font-extrabold text-[#6B7684]">신규 스터디 수</p>
              <strong className="mt-2 block text-3xl font-black tracking-[-0.05em] text-[#191F28]">
                {previewStats.newStudies}
              </strong>
            </article>
            <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5">
              <p className="text-xs font-extrabold text-[#6B7684]">부여될 권한 수</p>
              <strong className="mt-2 block text-3xl font-black tracking-[-0.05em] text-[#191F28]">
                {previewStats.grantsToAdd}
              </strong>
            </article>
          </section>

          <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">
                선생님별 배정 미리보기
              </h3>
              <StatusBadge tone="blue">기본 정책: O 표시만 추가</StatusBadge>
            </div>
            <p className="text-sm leading-6 text-[#6B7684]">
              기존 권한은 자동 삭제하지 않습니다. 권한 삭제는 관리자 화면에서 수동으로 처리할 수
              있도록 설계되어 있습니다.
            </p>

            <div className="mt-4 grid gap-3">
              {result.previewByTeacher.length === 0 ? (
                <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
                  O 표시된 권한이 없습니다.
                </p>
              ) : (
                result.previewByTeacher.map((row) => (
                  <article
                    key={row.teacherName}
                    className="rounded-2xl border border-[#E5E8EB] bg-[#FBFCFD] p-4"
                  >
                    <p className="text-sm font-black text-[#191F28]">{row.teacherName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {row.studies.map((study) => (
                        <StatusBadge key={`${row.teacherName}-${study}`} tone="gray">
                          {study}
                        </StatusBadge>
                      ))}
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                className="h-10"
                onClick={() => setAppliedCount(previewStats.grantsToAdd)}
                disabled={previewStats.grantsToAdd === 0}
              >
                적용하기(추가만)
              </Button>
            </div>
          </section>
        </>
      ) : null}

      {appliedCount > 0 ? (
        <section className="rounded-2xl bg-[#E9F8F0] px-4 py-3 text-sm font-bold text-[#007A48]">
          mock 적용 완료: 신규 권한 {appliedCount}건이 추가되었다고 가정합니다.
        </section>
      ) : null}
    </div>
  );
}
