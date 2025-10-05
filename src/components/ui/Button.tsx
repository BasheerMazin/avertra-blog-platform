"use client";

import * as React from "react";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-navy text-white hover:bg-indigo focus-visible:ring-cyan border-transparent",
  ghost:
    "bg-transparent text-navy hover:text-cyan focus-visible:ring-cyan border-transparent",
  accent:
    "bg-cyan text-ink hover:bg-[#19a5c3] focus-visible:ring-cyan border-transparent",
  outline:
    "bg-transparent text-navy border-slate-300 hover:border-navy hover:text-navy focus-visible:ring-cyan",
};

type ButtonVariant = "primary" | "ghost" | "accent" | "outline";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", type = "button", variant = "primary", ...props }, ref) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-pill px-5 py-2 font-semibold transition-colors duration-150 cursor-pointer border disabled:cursor-not-allowed disabled:opacity-60";
    const classes = [baseClasses, variantClasses[variant], className]
      .filter(Boolean)
      .join(" ");

    return <button ref={ref} className={classes} type={type} {...props} />;
  }
);

Button.displayName = "Button";
