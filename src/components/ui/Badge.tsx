type BadgeVariant = "gold" | "success" | "warning" | "danger" | "neutral";

const styles: Record<BadgeVariant, string> = {
  gold:    "bg-[#e8b84b]/10 text-[#e8b84b] border-[#e8b84b]/20",
  success: "bg-[#34d399]/10 text-[#34d399] border-[#34d399]/20",
  warning: "bg-[#fbbf24]/10 text-[#fbbf24] border-[#fbbf24]/20",
  danger:  "bg-[#f87171]/10 text-[#f87171] border-[#f87171]/20",
  neutral: "bg-[#6b6b7a]/10 text-[#6b6b7a] border-[#6b6b7a]/20",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${styles[variant]}`}
    >
      {children}
    </span>
  );
}
