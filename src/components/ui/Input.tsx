"use client";

import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
  labelClassName?: string;
  withPasswordToggle?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      wrapperClassName = "",
      labelClassName = "",
      className = "",
      type = "text",
      id,
      withPasswordToggle = false,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const isPasswordField = type === "password";
    const shouldAllowToggle = isPasswordField && withPasswordToggle;
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
    const resolvedType = shouldAllowToggle && isPasswordVisible ? "text" : type;

    const baseClasses =
      "block w-full rounded-[0.2rem] border border-slate-200 bg-white px-4 py-2 text-ink placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:border-ink disabled:cursor-not-allowed disabled:opacity-60";

    const classes = [
      baseClasses,
      className,
      shouldAllowToggle ? "pr-12" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const wrapperClasses = ["space-y-3", wrapperClassName].filter(Boolean).join(" ");
    const computedLabelClass = ["text-sm font-medium text-navy", labelClassName]
      .filter(Boolean)
      .join(" ");

    const toggleLabel = isPasswordVisible ? "Hide password" : "Show password";

    const handleToggle = () => {
      setIsPasswordVisible((current) => !current);
    };

    return (
      <div className={wrapperClasses}>
        <label htmlFor={inputId} className={computedLabelClass}>
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={classes}
            type={resolvedType}
            {...rest}
          />
          {shouldAllowToggle ? (
            <button
              type="button"
              onClick={handleToggle}
              aria-label={toggleLabel}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-mint-50 cursor-pointer"
            >
              {isPasswordVisible ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <path d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12Z" />
                  <circle cx="12" cy="12" r="3.75" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-5 w-5"
                >
                  <path d="M3.98 8.223A11.637 11.637 0 0 0 2.25 12s3.75 6.75 9.75 6.75c1.64 0 3.164-.39 4.518-1.016M9.878 9.878A3.75 3.75 0 0 0 12 15.75a3.74 3.74 0 0 0 2.122-.651" />
                  <path d="M6.112 6.112A11.643 11.643 0 0 1 12 5.25c6 0 9.75 6.75 9.75 6.75a11.67 11.67 0 0 1-2.068 2.938M3 3l18 18" />
                </svg>
              )}
            </button>
          ) : null}
        </div>
      </div>
    );
  }
);

Input.displayName = "Input";
