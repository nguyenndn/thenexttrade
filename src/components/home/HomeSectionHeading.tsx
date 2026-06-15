import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

interface HomeSectionHeadingProps {
  title: string;
  eyebrow?: string;
  description?: string;
  highlight?: string;
  align?: "left" | "center";
  icon?: LucideIcon;
  linkHref?: string;
  linkText?: string;
  contentClassName?: string;
  titleClassName?: string;
  className?: string;
}

function renderTitle(title: string, highlight?: string) {
  if (!highlight || !title.includes(highlight)) {
    return title;
  }

  const [before, after] = title.split(highlight);

  return (
    <>
      {before}
      <span className="text-gold">{highlight}</span>
      {after}
    </>
  );
}

export function HomeSectionHeading({
  title,
  eyebrow,
  description,
  highlight,
  align = "left",
  icon: Icon,
  linkHref,
  linkText = "View All",
  contentClassName = "",
  titleClassName = "",
  className = "",
}: HomeSectionHeadingProps) {
  const isCenter = align === "center";

  return (
    <div
      className={[
        isCenter ? "mx-auto max-w-3xl text-center" : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      ].join(" ")}
    >
      <div
        className={[
          isCenter ? "mx-auto flex max-w-3xl flex-col items-center" : "max-w-3xl",
          contentClassName,
        ].join(" ")}
      >
        {eyebrow && (
          <div
            className={[
              "mb-3 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-gold shadow-sm shadow-gold/[0.04]",
              isCenter ? "justify-center" : "",
            ].join(" ")}
          >
            {Icon && <Icon size={12} strokeWidth={2.6} />}
            <span>{eyebrow}</span>
          </div>
        )}

        <div>
          <div>
            <h2
              className={[
                "font-heading text-3xl font-black tracking-tight text-gray-850 dark:text-white sm:text-4xl",
                isCenter ? "leading-[1.08]" : "leading-tight",
                titleClassName,
              ].join(" ")}
            >
              {renderTitle(title, highlight)}
            </h2>

            {description && (
              <p
                className={[
                  "mt-3 text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base",
                  isCenter ? "mx-auto max-w-2xl" : "max-w-2xl",
                ].join(" ")}
              >
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      {linkHref && (
        <Link
          href={linkHref}
          className={[
            "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-white/80 px-4 py-2 text-xs font-black text-gray-800 shadow-sm transition-all duration-300 hover:border-gold hover:bg-gold/[0.08] hover:text-gray-950 dark:bg-white/[0.03] dark:text-white dark:hover:bg-gold/[0.06]",
            isCenter ? "mt-4" : "",
          ].join(" ")}
        >
          {linkText}
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
