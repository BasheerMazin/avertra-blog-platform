"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export type PostFormValues = {
  title: string;
  content: string;
  published: boolean;
};

export type PostFormResult = {
  error?: string;
};

type PostFormProps = {
  initialValues: PostFormValues;
  submitLabel: string;
  submittingLabel?: string;
  onSubmit: (values: PostFormValues) => Promise<PostFormResult | void>;
  onCancel?: () => void;
};

export function PostForm({
  initialValues,
  submitLabel,
  submittingLabel,
  onSubmit,
  onCancel,
}: PostFormProps) {
  const [values, setValues] = useState<PostFormValues>(initialValues);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const target = event.target;
      const { name, value } = target;
      const isCheckbox =
        target instanceof HTMLInputElement && target.type === "checkbox";
      setValues((prev) => ({
        ...prev,
        [name]: isCheckbox ? target.checked : value,
      }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError(null);
      setIsSubmitting(true);
      try {
        const result = await onSubmit(values);
        if (result && "error" in result && result.error) {
          setError(result.error);
          return;
        }
        setValues(initialValues);
        onCancel?.();
      } catch (submitError) {
        const message =
          submitError instanceof Error
            ? submitError.message
            : "Unexpected error";
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [initialValues, onCancel, onSubmit, values]
  );

  const canSubmit =
    values.title.trim().length > 0 && values.content.trim().length > 0;

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Input
        name="title"
        label="Title"
        value={values.title}
        onChange={handleChange}
        disabled={isSubmitting}
        placeholder="Give your post a title"
      />
      <Textarea
        name="content"
        label="Content"
        value={values.content}
        onChange={handleChange}
        disabled={isSubmitting}
        placeholder="Share your thoughts..."
        rows={8}
      />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          name="published"
          type="checkbox"
          checked={values.published}
          onChange={handleChange}
          disabled={isSubmitting}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span>Publish immediately</span>
      </label>
      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? submittingLabel ?? submitLabel : submitLabel}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
