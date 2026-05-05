import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#f0ece3]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`
            w-full px-3 py-2 rounded-lg border text-sm
            bg-[#13131a] border-[#1a1a24] text-[#f0ece3]
            placeholder:text-[#6b6b7a]
            focus:outline-none focus:border-[#e8b84b]/50 focus:ring-1 focus:ring-[#e8b84b]/20
            disabled:opacity-50
            ${error ? "border-[#f87171]/50" : ""}
            ${className}
          `}
          {...props}
        />
        {error && <p className="text-xs text-[#f87171]">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
