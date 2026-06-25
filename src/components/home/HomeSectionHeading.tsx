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
              "mb-2.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-gold/90 select-none",
              isCenter ? "justify-center" : "",
            ].join(" ")}
          >
            {Icon && <Icon size={11} strokeWidth={2.8} className="opacity-80" />}
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
            "group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gold hover:text-amber-500 transition-colors",
            isCenter ? "mt-4" : "",
          ].join(" ")}
        >
          {linkText}
          <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
