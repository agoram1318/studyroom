import type { ReactNode } from "react";

type Props = {
  title: string;
  description: string;
  badges?: ReactNode;
};

export function PageHeader({ title, description, badges }: Props) {
  return (
    <section className="rounded-[28px] border border-[#E5E8EB] bg-white p-7 shadow-[0_12px_28px_rgba(25,31,40,0.06)] md:p-9">
      {badges ? <div className="mb-4 flex flex-wrap gap-2">{badges}</div> : null}
      <h1 className="whitespace-pre-line text-3xl font-black leading-tight tracking-[-0.05em] text-[#191F28] md:text-5xl">
        {title}
      </h1>
      <p className="mt-4 text-[15px] leading-7 text-[#6B7684] md:text-[17px]">
        {description}
      </p>
    </section>
  );
}
