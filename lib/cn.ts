/**
 * Penggabung className minimal. Cukup untuk kebutuhan di sini dan menghindari
 * dua dependensi (clsx + tailwind-merge) untuk pekerjaan sebaris ini.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
