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
    <button
      type={type}
      aria-pressed={active}
      className={`${buttonClass(variant, size, active)} ${className}`}
      {...props}
    />
  );
}
