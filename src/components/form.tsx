"use client";

import { useFormStatus } from "react-dom";
import type { InputHTMLAttributes, ReactNode } from "react";

export function Field({ label, required, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-ink/80">
        {label}
        {required && <span className="ml-0.5 text-point">*</span>}
      </span>
      <input
        required={required}
        {...props}
        className="h-12 w-full rounded-[3px] border border-line bg-paper px-3.5 text-[15px] outline-none transition-colors placeholder:text-muted/60 focus:border-ink/50"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`h-12 w-full rounded-[3px] bg-point text-[15px] font-medium text-white transition-colors hover:bg-point-dark disabled:opacity-60 ${className}`}
    >
      {pending ? "처리 중…" : children}
    </button>
  );
}

export function FormMessage({ error, message }: { error?: string; message?: string }) {
  if (error) return <p role="alert" className="text-sm text-alert">{error}</p>;
  if (message) return <p className="text-sm text-point">{message}</p>;
  return null;
}
