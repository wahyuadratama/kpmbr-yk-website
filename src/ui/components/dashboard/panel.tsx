import * as React from "react";
import { cn } from "cn";

/**
 * Panel dashboard: kartu putih dengan border tipis.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-dashboard-border bg-white",
        className,
      )}
    >
      {title ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-dashboard-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-dashboard-text">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-dashboard-text-muted">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn("flex-1 p-4", bodyClassName)}>{children}</div>
    </section>
  );
}
