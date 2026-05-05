import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
};

const baseStyle =
  "inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-extrabold tracking-[-0.02em] transition";
const variantStyle: Record<Variant, string> = {
  primary: "bg-[#3182F6] text-white hover:brightness-95",
  secondary: "bg-[#F2F4F6] text-[#191F28] hover:bg-[#E9EDF0]",
};

export function Button({
  children,
  href,
  variant = "primary",
  className = "",
  onClick,
  disabled = false,
}: ButtonProps) {
  const classes = `${baseStyle} ${variantStyle[variant]} ${
    disabled ? "cursor-not-allowed opacity-60" : ""
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}
