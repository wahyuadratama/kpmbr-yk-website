import * as React from "react";
import { cn } from "cn";

/**
 * Judul halaman dashboard: judul besar, deskripsi sekunder, dan aksi kanan.
 */
export function PageHeading({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-dashboard-text">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-sm text-dashboard-text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
