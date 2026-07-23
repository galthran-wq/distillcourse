"use client";

import type { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Pressed/selected state (also sets aria-pressed). */
  active?: boolean;
}

export function Button({ active = false, className = "", ...props }: Props) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`min-h-11 rounded border px-3 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/10"
          : "border-line hover:border-faint"
      } ${className}`}
      {...props}
    />
  );
}
