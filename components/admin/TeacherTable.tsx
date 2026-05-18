"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/common/StatusBadge";

export type TeacherRow = {
  id: string;
  username: string | null;
  name: string | null;
  display_name: string | null;
  phone: string | null;
  memo: string | null;
};

type Props = {
  teachers: TeacherRow[];
  isAdmin?: boolean;
};

const CONFIRM_MESSAGE =
  "정말 이 참여자 계정을 삭제하시겠습니까?\n삭제하면 해당 참여자의 로그인 계정과 스터디 배정 정보가 함께 삭제됩니다.\n이 작업은 되돌릴 수 없습니다.";

export function TeacherTable({ teachers, isAdmin = false }: Props) {
  const [query, setQuery] = useState("");
  const [list, setList] = useState<TeacherRow[]>(teachers);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return list;

    return list.filter((teacher) => {
      const values = [
        teacher.username ?? "",
        teacher.name ?? "",
        teacher.display_name ?? "",
        teacher.phone ?? "",
        teacher.memo ?? "",
      ];
      return values.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [query, list]);

  async function handleDelete(teacher: TeacherRow) {
    const confirmed = window.confirm(CONFIRM_MESSAGE);
    if (!confirmed) return;

    setErrorMsg(null);
    setDeletingId(teacher.id);

    try {
      const res = await fetch(`/api/admin/teachers/${teacher.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? "삭제에 실패했습니다.");
      }
      setList((prev) => prev.filter((t) => t.id !== teacher.id));
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-[24px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black tracking-[-0.03em] text-[#191F28]">참여자 목록</h2>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름, 아이디, 전화번호로 검색"
          className="h-10 w-full rounded-2xl border border-[#E5E8EB] px-3 text-sm font-semibold outline-none md:w-[320px]"
        />
      </div>

      {errorMsg && (
        <p className="mb-3 rounded-2xl bg-[#FFF0F0] px-4 py-3 text-sm font-semibold text-[#E53E3E]">
          {errorMsg}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-[#F7F8FA] px-4 py-3 text-sm font-semibold text-[#6B7684]">
          조건에 맞는 참여자가 없습니다.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#EEF1F4]">
          <table className="w-full min-w-[760px] border-collapse bg-white">
            <thead>
              <tr className="bg-[#F7F8FA] text-left text-xs font-extrabold text-[#6B7684]">
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">표시명</th>
                <th className="px-4 py-3">아이디</th>
                <th className="px-4 py-3">전화번호</th>
                <th className="px-4 py-3">메모</th>
                {isAdmin && <th className="px-4 py-3 text-right">관리</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((teacher) => (
                <tr key={teacher.id} className="border-t border-[#EEF1F4] text-sm text-[#191F28]">
                  <td className="px-4 py-3">
                    <StatusBadge tone="blue">참여자</StatusBadge>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {teacher.display_name ?? teacher.name ?? "이름 없음"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#4E5968]">
                    {teacher.username ?? "-"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-[#4E5968]">{teacher.phone ?? "-"}</td>
                  <td className="px-4 py-3 font-semibold text-[#6B7684]">{teacher.memo ?? "-"}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(teacher)}
                        disabled={deletingId === teacher.id}
                        className="rounded-xl bg-[#FFF0F0] px-3 py-1.5 text-xs font-bold text-[#E53E3E] transition hover:bg-[#FFE0E0] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === teacher.id ? "삭제 중..." : "삭제"}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
