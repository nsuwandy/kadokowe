import { cn } from "@/lib/cn";

/** Page gutter and max width, shared by every section. */
export function Wrap({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-[1440px] px-gutter", className)}>
      {children}
    </div>
  );
}

export function Section({
  children,
  tone = "paper",
  className,
}: {
  children: React.ReactNode;
  tone?: "paper" | "warm" | "ink";
  className?: string;
}) {
  return (
    <section
      className={cn(
        "py-14 md:py-20 lg:py-28",
        tone === "warm" && "bg-warm",
        tone === "ink" && "bg-ink text-warm",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function Eyebrow({
  children,
  accent = false,
  className,
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("eyebrow", accent && "text-red", className)}>{children}</p>
  );
}

/** The small bordered label used on product cards. */
export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="border border-line px-2 py-1 text-[0.5625rem] font-semibold uppercase tracking-[0.11em] whitespace-nowrap text-muted">
      {children}
    </span>
  );
}

/**
 * Section heading paired with supporting copy, set on an uneven two-column
 * grid. Used at the head of most editorial sections.
 */
export function SectionHead({
  eyebrow,
  title,
  intro,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 grid items-end gap-6 md:mb-14 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
      <div className="flex flex-col gap-4">
        {eyebrow && <Eyebrow accent>{eyebrow}</Eyebrow>}
        <h2 className="balance text-xl-display font-bold tracked-tight">
          {title}
        </h2>
      </div>
      {(intro || action) && (
        <div className="flex flex-col items-start gap-4">
          {intro && (
            <p className="max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted">
              {intro}
            </p>
          )}
          {action}
        </div>
      )}
    </div>
  );
}
