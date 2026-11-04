import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { BrokerComparisonCards } from "./broker-funded/BrokerComparisonCards";
import { BrokerTrustPillars } from "./broker-funded/BrokerTrustPillars";
import { BrokerCapitalFlow } from "./broker-funded/BrokerCapitalFlow";

interface BrokerFundedMembershipSectionProps {
    isLoggedIn?: boolean;
}

export function BrokerFundedMembershipSection({
    isLoggedIn = false,
}: BrokerFundedMembershipSectionProps) {
    return (
        <section id="sponsorship-preview" className="relative overflow-hidden bg-white dark:bg-transparent py-8 sm:py-12 border-t border-gray-200 dark:border-white/10">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent dark:from-gold/[0.03] dark:via-transparent dark:to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* 1. Standardized Section Heading */}
                <HomeSectionHeading
                    align="center"
                    title={
                        <>
                            You never pay us <br className="hidden sm:inline" />
                            <span className="text-gold">Your $200 stays 100% yours</span>
                        </>
                    }
                    description="Start with a Free Account ($0, no broker deposit required) to access our Academy, 17 Risk Calculators, and 7-day Demo/Live trial. When you're ready for permanent VIP access, simply fund your own broker account with $200 at $0 software cost."
                    className="mb-6 sm:mb-8"
                />

                {/* 2. Side-by-Side Full-Width Comparison Cards */}
                <BrokerComparisonCards />

                {/* 3. Four Trust Pillars Grid */}
                <BrokerTrustPillars />

                {/* 4. Capital Flow Diagram */}
                <BrokerCapitalFlow />

                {/* 5. Primary Call-to-Action */}
                <div className="text-center max-w-xl mx-auto">
                    <Link
                        href={
                            isLoggedIn
                                ? "/dashboard/accounts"
                                : "/auth/signup?intent=BROKER_FUNDED&source=broker_funded_section"
                        }
                        className={cn(
                            buttonVariants({ variant: "gold" }),
                            "w-full sm:w-auto min-h-12 px-8 rounded-lg bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 inline-flex items-center justify-center gap-2 group"
                        )}
                    >
                        <span>
                            {isLoggedIn
                                ? "Connect Your Broker Account"
                                : "Unlock VIP via Broker Deposit"}
                        </span>
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2.5 font-medium">
                        Zero software fee · Your $200 deposit stays 100% in your own name · Withdraw anytime
                    </p>
                </div>
            </div>
        </section>
    );
}
