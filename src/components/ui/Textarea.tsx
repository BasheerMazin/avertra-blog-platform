"use client";

import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  wrapperClassName?: string;
  labelClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      wrapperClassName = "",
      labelClassName = "",
      className = "",
      id,
      rows = 6,
      ...rest
    },
    ref
  ) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;

    const baseClasses =
      "block w-full rounded-[0.2rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:border-ink disabled:cursor-not-allowed disabled:opacity-60";

    const classes = [baseClasses, className].filter(Boolean).join(" ");
    const wrapperClasses = ["space-y-3", wrapperClassName]
      .filter(Boolean)
      .join(" ");
    const computedLabelClass = ["text-sm font-medium text-navy", labelClassName]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={wrapperClasses}>
        <label htmlFor={textareaId} className={computedLabelClass}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          className={classes}
          rows={rows}
          {...rest}
        />
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
