import { socialIconFor } from "@/shared/social-icons";
import type { SocialLink } from "@/shared/types";
import { cn } from "@/shared/cn";

/**
 * Daftar ikon sosial media. Dipakai hero dan footer.
 * Tidak dirender sama sekali kalau tidak ada tautan terbit.
 */
export function SocialIconLinks({
  links,
  size = "md",
  className,
}: {
  links: SocialLink[];
  size?: "sm" | "md";
  className?: string;
}) {
  if (links.length === 0) return null;

  const kotak = size === "sm" ? "size-8" : "size-10";
  const ikon = size === "sm" ? "size-3.5" : "size-4";

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {links.map((link) => {
        const { icon: Icon, label } = socialIconFor(link.platform);

        return (
          <li key={link.id}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center justify-center rounded-pill border border-border-subtle text-text-muted transition-colors hover:border-accent hover:text-accent",
                kotak,
              )}
            >
              <Icon className={ikon} aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
