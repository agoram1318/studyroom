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
};

export function TeacherTable({ teachers }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return teachers;

    return teachers.filter((teacher) => {
      const values = [
        teacher.username ?? "",
        teacher.name ?? "",
        teacher.display_name ?? "",
        teacher.phone ?? "",
        teacher.memo ?? "",
      ];
      return values.some((value) => value.toLowerCase().includes(keyword));
    });
  }, [query, teachers]);

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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
