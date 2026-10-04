import { SocialIconLinks } from "@/client/components/layout/social-icon-links";
import type { Profile, SocialLink } from "@/shared/types";

/**
 * Footer di setiap halaman publik. Nama dan tautan sosial berasal dari
 * database; hanya tautan terbit yang diteruskan ke sini oleh query.
 */
export function Footer({
  profile,
  socialLinks,
}: {
  profile: Profile | null;
  socialLinks: SocialLink[];
}) {
  const nama = profile?.full_name ?? "Portofolio";
  const tahun = new Date().getFullYear();

  return (
    <footer className="border-t border-border-subtle bg-surface-raised">
      <div className="wadah flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-heading text-sm font-semibold text-text">{nama}</p>
          <p className="mt-1 text-sm text-text-subtle">
            © {tahun} {nama}. Seluruh hak cipta dilindungi.
          </p>
        </div>

        <SocialIconLinks links={socialLinks} size="sm" />
      </div>
    </footer>
  );
}
