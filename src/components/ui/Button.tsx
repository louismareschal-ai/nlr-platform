"use client";

import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary:
    "bg-[#e8b84b] text-[#050508] font-semibold hover:bg-[#d4a43a] disabled:opacity-50",
  secondary:
    "bg-[#1a1a24] text-[#f0ece3] border border-[#2a2a38] hover:bg-[#22222e] disabled:opacity-50",
  ghost:
    "bg-transparent text-[#6b6b7a] hover:text-[#f0ece3] hover:bg-[#1a1a24] disabled:opacity-50",
  danger:
    "bg-[#f87171]/10 text-[#f87171] border border-[#f87171]/20 hover:bg-[#f87171]/20 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg
        text-sm transition-colors cursor-pointer
        ${styles[variant]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
