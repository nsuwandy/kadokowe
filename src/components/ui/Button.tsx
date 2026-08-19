import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "ghost" | "onDark" | "onRed";

const base =
  "inline-flex items-center justify-center gap-2 font-display text-[0.8125rem] font-semibold uppercase tracking-[0.1em] px-7 py-4 border transition-colors duration-150 cursor-pointer";

const variants: Record<Variant, string> = {
  primary: "bg-red text-paper border-transparent hover:bg-ink",
  ghost: "bg-transparent border-current hover:bg-ink hover:text-paper",
  onDark:
    "bg-transparent border-paper/50 text-warm hover:bg-warm hover:text-ink hover:border-warm",
  onRed: "bg-paper text-red border-transparent hover:bg-ink hover:text-paper",
};

type Props = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
} & (
  | ({ href: string } & Omit<React.ComponentProps<typeof Link>, "href" | "className">)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: Props) {
  const classes = cn(base, variants[variant], className);

  if (props.href !== undefined) {
    const { href, ...rest } = props;
    return (
      <Link href={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  const { href: _ignored, ...rest } = props as { href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>;
  void _ignored;
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}

/**
 * The small arrow link used throughout the editorial sections. The arrow
 * shifts on hover — a deliberate micro-interaction carried from the approved
 * concept, and the only motion in the component set.
 */
export function ArrowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.13em] text-red",
        className,
      )}
    >
      <span>{children}</span>
      <span className="transition-transform duration-200 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
