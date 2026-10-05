import * as React from "react";
import Link from "next/link";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  PROGRAM_STATUS_CLASS,
  PROGRAM_STATUS_LABEL,
  type WorkProgram,
} from "@/types/public";

type ProgramCardProps = {
  program: WorkProgram;
  className?: string;
};

/**
 * Kartu program kerja. Menampilkan divisi, PIC, status, dan progres sesuai
 * data minimal pada requirement §14.
 */
export function ProgramCard({ program, className }: ProgramCardProps) {
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-brand/30",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
          {program.division}
        </p>
        <Badge
          variant="outline"
          className={cn(
            "px-1.5 py-0 text-[0.65rem]",
            PROGRAM_STATUS_CLASS[program.status],
          )}
        >
          {PROGRAM_STATUS_LABEL[program.status]}
        </Badge>
      </div>

      <h3 className="mt-2.5 text-base font-semibold tracking-tight">
        <Link
          href={`/proker/${program.slug}`}
          className="rounded-sm outline-none after:absolute after:inset-0 hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          {program.name}
        </Link>
      </h3>

      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {program.description}
      </p>

      <dl className="mt-4 space-y-1 text-xs text-muted-foreground">
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-foreground/70">PIC</dt>
          <dd className="truncate">{program.picName}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-medium text-foreground/70">Timeline</dt>
          <dd className="truncate">{program.timeline}</dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progres</span>
          <span className="font-medium tabular-nums">
            {program.progress}%
          </span>
        </div>
        <Progress
          value={program.progress}
          aria-label={`Progres ${program.name}`}
          className="mt-2"
        />
      </div>
    </article>
  );
}