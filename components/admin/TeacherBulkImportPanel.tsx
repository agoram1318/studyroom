"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/common/StatusBadge";

type RowData = {
  name: string;
  phone: string;
  memo: string;
};

type CreatedResult = {
  username: string;
  name: string;
  phone: string;
  display_name: string;
  email: string;
  temp_password: string;
};

type SkippedResult = {
  username: string;
  reason: string;
};

type ApiResult = {
  success: boolean;
  created_count: number;
  skipped_count: number;
  created: CreatedResult[];
  skipped: SkippedResult[];
};

function toText(value: unknown) {
  return String(value ?? "").trim();
}

function parseSheet(file: File): Promise<RowData[]> {
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
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          defval: "",
        });

        const parsed = rows.map((row) => ({
          name: toText(row.name),
          phone: toText(row.phone),
          memo: toText(row.memo),
        }));
        resolve(parsed);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("엑셀 파싱 오류"));
      }
    };
    reader.onerror = () => reject(new Error("파일 읽기 실패"));
    reader.readAsArrayBuffer(file);
  });
}

export function TeacherBulkImportPanel() {
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<RowData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);

  const onFileChange = async (file: File) => {
    setIsLoading(true);
    setError("");
    setResult(null);
    setFileName(file.name);
    try {
      const parsedRows = await parseSheet(file);
      setRows(parsedRows);
    } catch (uploadError) {
      setRows([]);
      setError(uploadError instanceof Error ? uploadError.message : "업로드 실패");
    } finally {
      setIsLoading(false);
    }
  };

  const applyImport = async () => {
    setIsSubmitting(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/admin/teachers/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachers: rows }),
      });
      const payload = (await response.json()) as ApiResult & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "일괄 생성에 실패했습니다.");
        return;
      }
      setResult(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "요청 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
      <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">참여자 엑셀 일괄 생성</h2>
      <p className="mt-2 text-sm leading-6 text-[#6B7684]">
        컬럼명은 `name`, `phone`, `memo`를 사용하세요. 아이디는 `이름+전화번호 뒤 4자리`, 비밀번호는 서버 랜덤으로 자동 생성됩니다.
      </p>

      <div className="mt-4 rounded-2xl border border-dashed border-[#C8D1DB] bg-[#FBFCFD] p-4">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onFileChange(file);
          }}
          className="block w-full text-sm font-semibold text-[#4E5968] file:mr-4 file:rounded-xl file:border-0 file:bg-[#E8F3FF] file:px-3 file:py-2 file:text-sm file:font-extrabold file:text-[#3182F6]"
        />
        {fileName ? (
          <p className="mt-2 text-xs font-semibold text-[#6B7684]">선택 파일: {fileName}</p>
        ) : null}
      </div>

      {isLoading ? <p className="mt-3 text-sm font-semibold text-[#3182F6]">파일 분석 중...</p> : null}
      {error ? <p className="mt-3 text-sm font-semibold text-[#F04452]">{error}</p> : null}

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone="blue">미리보기 {rows.length}건</StatusBadge>
            <Button className="h-10" onClick={applyImport} disabled={isSubmitting}>
              {isSubmitting ? "생성 중..." : "엑셀로 참여자 생성"}
            </Button>
          </div>
          <div className="max-h-[220px] overflow-auto rounded-2xl border border-[#EEF1F4]">
            <table className="w-full min-w-[680px] border-collapse bg-white text-sm">
              <thead className="bg-[#F7F8FA] text-left text-xs font-extrabold text-[#6B7684]">
                <tr>
                  <th className="px-3 py-2">이름</th>
                  <th className="px-3 py-2">전화번호</th>
                  <th className="px-3 py-2">생성 아이디(예상)</th>
                  <th className="px-3 py-2">메모</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, index) => (
                  <tr key={`${row.name}-${row.phone}-${index}`} className="border-t border-[#EEF1F4]">
                    <td className="px-3 py-2">{row.name || "-"}</td>
                    <td className="px-3 py-2">{row.phone || "-"}</td>
                    <td className="px-3 py-2">
                      {row.name && row.phone
                        ? `${row.name.replace(/\s+/g, "")}${row.phone.replace(/\D/g, "").slice(-4)}`
                        : "-"}
                    </td>
                    <td className="px-3 py-2">{row.memo || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge tone="green">생성 {result.created_count}건</StatusBadge>
            <StatusBadge tone="yellow">스킵 {result.skipped_count}건</StatusBadge>
          </div>
          {result.created.length > 0 ? (
            <div className="rounded-2xl border border-[#EEF1F4] bg-[#FBFCFD] p-4">
              <p className="text-sm font-extrabold text-[#191F28]">
                생성 완료 계정 (초기 비밀번호는 지금만 확인 가능)
              </p>
              <div className="mt-3 max-h-[280px] overflow-auto">
                <table className="w-full min-w-[860px] border-collapse bg-white text-sm">
                  <thead className="bg-[#F7F8FA] text-left text-xs font-extrabold text-[#6B7684]">
                    <tr>
                      <th className="px-3 py-2">이름</th>
                      <th className="px-3 py-2">아이디</th>
                      <th className="px-3 py-2">이메일</th>
                      <th className="px-3 py-2">임시 비밀번호</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((item) => (
                      <tr key={item.username} className="border-t border-[#EEF1F4]">
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.username}</td>
                        <td className="px-3 py-2">{item.email}</td>
                        <td className="px-3 py-2 font-extrabold text-[#191F28]">{item.temp_password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
          {result.skipped.length > 0 ? (
            <div className="rounded-2xl border border-[#F8E0B8] bg-[#FFF7DF] p-4">
              <p className="text-sm font-extrabold text-[#9A6400]">스킵된 항목</p>
              <ul className="mt-2 space-y-1 text-sm font-semibold text-[#9A6400]">
                {result.skipped.map((item, index) => (
                  <li key={`${item.username}-${index}`}>
                    {item.username}: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
