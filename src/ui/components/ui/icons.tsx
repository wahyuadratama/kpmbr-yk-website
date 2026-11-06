import * as React from "react";

/**
 * Ikon merek yang TIDAK tersedia di lucide-react v1.
 *
 * lucide-react v1 menghapus ikon brand (Instagram, X, Facebook, dan
 * sejenisnya). Untuk kasus yang benar-benar memerlukan logo brand, ikon
 * digambar sendiri sebagai SVG inline agar tidak menambah dependensi.
 */

type IconProps = React.SVGProps<SVGSVGElement>;

export function InstagramIcon({ className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}