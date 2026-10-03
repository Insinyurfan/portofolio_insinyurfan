"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { kirimPesanAction } from "@/app/(public)/actions";
import {
  HoneypotField,
  nilaiHoneypot,
} from "@/components/public/honeypot-field";
import { HONEYPOT_FIELD } from "@/lib/public/constants";
import { contactMessageSchema } from "@/lib/schemas";
import { cn } from "@/lib/cn";

type Nilai = z.input<typeof contactMessageSchema>;
/** Hasil setelah transform zod — inilah bentuk yang diterima aksi server. */
type Keluaran = z.output<typeof contactMessageSchema>;

/**
 * Form kontak publik.
 *
 * Validasi memakai skema yang SAMA dengan yang dipakai server — server tetap
 * menjadi penentu, tetapi pengunjung mendapat umpan balik seketika.
 *
 * `react-hook-form` menyimpan nilai di state klien, jadi isian pengunjung
 * bertahan apa pun yang terjadi: gagal validasi, ditolak batas laju, atau
 * kegagalan server.
 */
export function ContactForm() {
  const [hasil, setHasil] = useState<
    { tipe: "sukses" | "gagal"; pesan: string } | null
  >(null);
  const statusRef = useRef<HTMLParagraphElement | null>(null);
  const honeypotRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Nilai, unknown, Keluaran>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: {
      sender_name: "",
      sender_email: "",
      subject: "",
      body: "",
      nomor_referensi: "",
    },
  });

  async function kirim() {
    setHasil(null);

    // Nilai MENTAH form, ditambah honeypot yang dibaca langsung dari DOM.
    // Server yang mem-parse dan mentransformnya.
    const r = await kirimPesanAction({
      ...getValues(),
      [HONEYPOT_FIELD]: nilaiHoneypot(honeypotRef),
    });

    if (r.ok) {
      setHasil({ tipe: "sukses", pesan: r.message });
      reset();
      return;
    }

    if (r.fieldErrors) {
      for (const [field, pesan] of Object.entries(r.fieldErrors)) {
        setError(field as keyof Nilai, { message: pesan });
      }
      // Fokus diarahkan ke field bermasalah yang pertama.
      const pertama = Object.keys(r.fieldErrors)[0];
      if (pertama) setFocus(pertama as keyof Nilai);
    }

    setHasil({ tipe: "gagal", pesan: r.message });
  }

  function onInvalid() {
    // Validasi klien gagal: arahkan fokus ke field bermasalah pertama.
    const pertama = Object.keys(errors)[0];
    if (pertama) setFocus(pertama as keyof Nilai);
  }

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(() => kirim(), onInvalid)(event);
      }}
      noValidate
      className="relative space-y-4"
    >
      <HoneypotField inputRef={honeypotRef} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="sender_name" label="Nama" error={errors.sender_name?.message} required>
          {(aria) => (
            <Input {...aria} {...register("sender_name")} autoComplete="name" />
          )}
        </Field>

        <Field id="sender_email" label="Email" error={errors.sender_email?.message} required>
          {(aria) => (
            <Input
              {...aria}
              {...register("sender_email")}
              type="email"
              autoComplete="email"
            />
          )}
        </Field>
      </div>

      <Field
        id="subject"
        label="Subjek"
        hint="Opsional."
        error={errors.subject?.message}
      >
        {(aria) => <Input {...aria} {...register("subject")} />}
      </Field>

      <Field id="body" label="Pesan" error={errors.body?.message} required>
        {(aria) => (
          <textarea
            {...aria}
            {...register("body")}
            rows={6}
            className="w-full rounded-card border border-border-strong bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-subtle aria-invalid:border-accent"
          />
        )}
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-pill bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden="true" />
        {isSubmitting ? "Mengirim…" : "Kirim pesan"}
      </button>

      {/*
        role="status" membuat hasilnya diumumkan ke teknologi bantu tanpa
        memindahkan fokus pengunjung.
      */}
      {hasil ? (
        <p
          ref={statusRef}
          role="status"
          className={cn(
            "rounded-card px-4 py-3 text-sm font-medium",
            hasil.tipe === "sukses"
              ? "bg-accent-soft text-accent-soft-text"
              : "border border-border-strong bg-surface-sunken text-text",
          )}
        >
          {hasil.pesan}
        </p>
      ) : null}
    </form>
  );
}

/** Field berlabel dengan pesan error yang terkait lewat aria-describedby. */
function Field({
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
  children: (aria: {
    id: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}) {
  const idError = `${id}-error`;
  const idHint = `${id}-hint`;
  const describedBy =
    [error ? idError : null, hint ? idHint : null].filter(Boolean).join(" ") ||
    undefined;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-text">
        {label}
        {required ? (
          <span className="ml-1 text-accent" aria-hidden="true">
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
        <p id={idHint} className="text-xs text-text-subtle">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={idError} className="text-xs font-semibold text-accent">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-card border border-border-strong bg-surface-raised px-3 text-sm text-text placeholder:text-text-subtle aria-invalid:border-accent",
        className,
      )}
      {...props}
    />
  );
}
