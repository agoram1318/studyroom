"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { Application } from "@/types";

type Props = {
  applications: Application[];
};

export function ApplicationTable({ applications }: Props) {
  const [query, setQuery] = useState("");
  const [studyFilter, setStudyFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const studies = useMemo(
    () => [...new Set(applications.map((item) => item.studyTitle))],
    [applications],
  );

  const rows = useMemo(() => {
    return applications.filter((item) => {
      const keyword = `${item.name} ${item.phone} ${item.studyTitle}`.toLowerCase();
      const queryMatched = keyword.includes(query.toLowerCase());
      const studyMatched = studyFilter === "all" || item.studyTitle === studyFilter;
      const paymentMatched =
        paymentFilter === "all" || item.paymentStatus === paymentFilter;
      return queryMatched && studyMatched && paymentMatched;
    });
  }, [applications, paymentFilter, query, studyFilter]);

  return (
    <section className="rounded-[26px] border border-[#E5E8EB] bg-white p-5 shadow-[0_10px_22px_rgba(25,31,40,0.035)] md:p-6">
      <div className="mb-4 flex flex-col gap-2.5 md:flex-row">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="이름, 연락처, 스터디명 검색"
          className="h-11 flex-1 rounded-2xl border border-[#E5E8EB] bg-white px-4 text-sm font-semibold text-[#191F28] outline-none placeholder:text-[#9AA5B1]"
        />
        <select
          value={studyFilter}
          onChange={(event) => setStudyFilter(event.target.value)}
          className="h-11 rounded-2xl border border-[#E5E8EB] bg-white px-4 text-sm font-bold text-[#4E5968] outline-none"
        >
          <option value="all">전체 스터디</option>
          {studies.map((study) => (
            <option key={study} value={study}>
              {study}
            </option>
          ))}
        </select>
        <select
          value={paymentFilter}
          onChange={(event) => setPaymentFilter(event.target.value)}
          className="h-11 rounded-2xl border border-[#E5E8EB] bg-white px-4 text-sm font-bold text-[#4E5968] outline-none"
        >
          <option value="all">입금 상태 전체</option>
          <option value="paid">입금완료</option>
          <option value="unpaid">미입금</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E5E8EB]">
        <table className="w-full min-w-[760px] border-collapse">
          <thead className="bg-[#FBFCFD]">
            <tr className="text-left text-xs font-black text-[#6B7684]">
              <th className="px-4 py-3">신청자</th>
              <th className="px-4 py-3">스터디</th>
              <th className="px-4 py-3">입금</th>
              <th className="px-4 py-3">승인</th>
              <th className="px-4 py-3">톡방</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-[#E5E8EB] text-sm">
                <td className="px-4 py-3.5">
                  <strong className="block font-black text-[#191F28]">{row.name}</strong>
                  <small className="mt-1 block text-xs font-semibold text-[#6B7684]">
                    {row.phone}
                  </small>
                </td>
                <td className="px-4 py-3.5 font-semibold text-[#4E5968]">
                  {row.studyTitle}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge tone={row.paymentStatus === "paid" ? "green" : "red"}>
                    {row.paymentStatus === "paid" ? "입금완료" : "미입금"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge tone={row.approvalStatus === "approved" ? "blue" : "yellow"}>
                    {row.approvalStatus === "approved" ? "승인완료" : "대기"}
                  </StatusBadge>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge tone={row.chatInviteStatus === "invited" ? "gray" : "yellow"}>
                    {row.chatInviteStatus === "invited" ? "초대완료" : "초대필요"}
                  </StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
