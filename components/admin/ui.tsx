import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Primitif UI dashboard admin.
 *
 * Semuanya memakai token ber-prefiks `adm-` yang hanya terdefinisi di bawah
 * `.admin-root`. Itu yang menjaga gaya admin tidak pernah bocor ke halaman
 * publik, dan sebaliknya. Lihat app/globals.css → "TOKEN DASHBOARD ADMIN".
 */

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-adm text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ring [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-adm-primary text-adm-primary-fg hover:bg-adm-primary-hover",
        outline:
          "border border-adm-border-strong bg-adm-panel text-adm-fg hover:bg-adm-panel-muted",
        ghost: "text-adm-fg-muted hover:bg-adm-panel-muted hover:text-adm-fg",
        danger: "bg-adm-danger text-adm-danger-fg hover:bg-adm-danger-hover",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      type="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export function Panel({
  className,
  children,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-adm border border-adm-border bg-adm-panel p-5",
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-adm border border-adm-border bg-adm-panel px-3 text-sm text-adm-fg placeholder:text-adm-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-adm-ring disabled:opacity-60",
        "aria-invalid:border-adm-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-adm border border-adm-border bg-adm-panel px-3 py-2 text-sm text-adm-fg placeholder:text-adm-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-adm-ring",
        "aria-invalid:border-adm-danger",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-adm border border-adm-border bg-adm-panel px-3 text-sm text-adm-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-adm-ring",
        "aria-invalid:border-adm-danger",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      className={cn(
        "size-4 rounded border-adm-border-strong accent-adm-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-adm-ring",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Pembungkus satu field: label terhubung, pesan error terkait lewat
 * aria-describedby, dan aria-invalid disetel otomatis.
 */
export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: (ariaProps: {
    id: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }) => ReactNode;
}) {
  const idError = `${id}-error`;
  const idHint = `${id}-hint`;
  const describedBy =
    [error ? idError : null, hint ? idHint : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-adm-fg">
        {label}
        {required ? (
          <span className="ml-1 text-adm-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}

      {hint ? (
        <p id={idHint} className="text-xs text-adm-fg-subtle">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={idError} className="text-xs font-medium text-adm-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-adm-panel-muted text-adm-fg-muted",
    success: "bg-adm-success-soft text-adm-success-fg",
    warning: "bg-adm-warning-soft text-adm-warning-fg",
    danger: "bg-adm-danger-soft text-adm-danger",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-adm-fg">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-adm-fg-muted">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-adm border border-dashed border-adm-border-strong bg-adm-panel px-6 py-10 text-center">
      <p className="font-semibold text-adm-fg">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-sm text-adm-fg-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
