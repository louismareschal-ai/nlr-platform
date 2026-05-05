import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  gold?: boolean;
}

export function Card({ gold = false, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`
        rounded-xl border p-5
        ${gold
          ? "bg-[#13131a] border-[#e8b84b]/20"
          : "bg-[#0d0d12] border-[#1a1a24]"
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}
