import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";

interface BrokerRankingActionsProps {
    url: string | null;
    activeTab: "brokers" | "crypto";
}

export function BrokerRankingActions({
    url,
    activeTab,
}: BrokerRankingActionsProps) {
    return (
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/10 md:w-44 lg:w-full shrink-0">
            <a
                href={url || "#"}
                target={url && url !== "#" ? "_blank" : undefined}
                rel={
                    url && url !== "#"
                        ? "noopener noreferrer"
                        : undefined
                }
                className={buttonVariants({
                    variant: "gold",
                    size: "smd",
                    className:
                        "flex-1 font-black shadow-sm hover:shadow-md justify-center gap-1 whitespace-nowrap",
                })}
            >
                {activeTab === "brokers" ? "Trade Now" : "Open Exchange"}
                <ExternalLink size={11} />
            </a>
            <Link
                href={
                    activeTab === "brokers"
                        ? "/brokers?tab=brokers"
                        : "/brokers?tab=cryptoExchanges"
                }
                className={buttonVariants({
                    variant: "outline",
                    size: "smd",
                    className:
                        "font-bold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white justify-center whitespace-nowrap",
                })}
            >
                Review
            </Link>
        </div>
    );
}
