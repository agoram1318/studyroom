"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/dashboard", label: "선생님 홈" },
  { href: "/studies/mid2-final", label: "스터디 상세" },
  { href: "/studies/mid2-final/lessons/l3", label: "회차 상세" },
  { href: "/admin", label: "관리자" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(Boolean(data.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthed(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#E5E8EBCC] bg-[#F7F8FAD6] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1180px] items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#3182F6] text-sm font-black text-white">
            B
          </span>
          <span className="text-base font-black tracking-[-0.02em] text-[#191F28]">
            봉샘스쿨 스터디룸
          </span>
        </Link>
        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3.5 py-2 text-sm font-bold ${
                  active
                    ? "bg-white text-[#191F28] shadow-[0_6px_14px_rgba(25,31,40,0.04)]"
                    : "text-[#6B7684]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isAuthed ? (
            <button
              onClick={handleLogout}
              className="rounded-full px-3.5 py-2 text-sm font-bold text-[#6B7684]"
            >
              로그아웃
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-3.5 py-2 text-sm font-bold text-[#6B7684]"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-white px-3.5 py-2 text-sm font-bold text-[#191F28] shadow-[0_6px_14px_rgba(25,31,40,0.04)]"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
