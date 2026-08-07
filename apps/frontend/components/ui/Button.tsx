"use client";

import type { ButtonHTMLAttributes } from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./styles";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Toggle state (also sets aria-pressed). Leave unset on plain buttons. */
  active?: boolean;
}

export function Button({
  variant = "outline",
  size = "md",
  active,
  type = "button",
  className = "",
  ...props
}: Props) {
  return (
    // `className` can only add — Tailwind resolves two utilities for the same
    // property by stylesheet order, not by which was written last, so a caller
    // cannot override the padding or the radius the size sets. Anything that
    // needs a different shape is a `size`, not a class.
    <button
      type={type}
      aria-pressed={active}
      className={`${buttonClass(variant, size, active)} ${className}`}
      {...props}
    />
  );
}
