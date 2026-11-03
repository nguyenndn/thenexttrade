import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { SpreadsheetEssenceCards } from "./spreadsheet/SpreadsheetEssenceCards";
import { SpreadsheetComparisonTable } from "./spreadsheet/SpreadsheetComparisonTable";

interface SpreadsheetComparisonSectionProps {
    isLoggedIn: boolean;
}

export function SpreadsheetComparisonSection({
    isLoggedIn,
}: SpreadsheetComparisonSectionProps) {
    return (
        <div className="relative overflow-hidden bg-white dark:bg-transparent border-t border-gray-200 dark:border-white/10">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Section Header */}
                <HomeSectionHeading
                    align="center"
                    title={
                        <>
                            Spreadsheets record history. <br className="hidden sm:inline" />
                            <span className="text-gold">TheNextTrade protects your capital.</span>
                        </>
                    }
                    description="Excel tells you that you lost money on Thursday. TheNextTrade tells you why: 3x revenge lot size on Gold after London close."
                    icon={Sparkles}
                    className="mb-8"
                />

                <div className="w-full">
                    {/* TheNextTrade Essence - 4 Columns expanding to full max-w-7xl */}
                    <SpreadsheetEssenceCards />

                    {/* Comparison Table */}
                    <SpreadsheetComparisonTable />

                    {/* CTA */}
                    <div className="flex justify-center mt-10">
                        <Link
                            href={
                                isLoggedIn
                                    ? "/dashboard"
                                    : "/auth/signup?source=feature_comparison"
                            }
                            className={cn(
                                buttonVariants({ variant: "gold" }),
                                "w-full sm:w-auto min-h-12 px-8 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all flex items-center justify-center gap-2 animate-btn-shine group"
                            )}
                        >
                            <span>
                                {isLoggedIn
                                    ? "Open My Journal"
                                    : "Start Free Journal"}
                            </span>
                            <ArrowRight
                                size={16}
                                className="group-hover:translate-x-1 transition-transform duration-300"
                            />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
