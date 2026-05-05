type Props = {
  label: string;
  value: number;
};

export function AdminStatCard({ label, value }: Props) {
  return (
    <article className="rounded-[22px] border border-[#E5E8EB] bg-white p-5 shadow-[0_8px_20px_rgba(25,31,40,0.03)]">
      <span className="text-xs font-extrabold text-[#6B7684]">{label}</span>
      <strong className="mt-2.5 block text-3xl font-black tracking-[-0.05em] text-[#191F28]">
        {value}
      </strong>
    </article>
  );
}
