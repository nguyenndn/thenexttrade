interface BrokerSpecsMatrixProps {
    activeTab: "brokers" | "crypto";
    minDeposit?: string;
    maxLeverage?: string;
    marketType?: string;
    assets?: string;
    regulation: string;
    rating: number;
}

export function BrokerSpecsMatrix({
    activeTab,
    minDeposit,
    maxLeverage,
    marketType,
    assets,
    regulation,
    rating,
}: BrokerSpecsMatrixProps) {
    return (
        <div className="rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 divide-y divide-gray-200/60 dark:divide-white/5 text-xs overflow-hidden mb-3.5">
            <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
                <div className="px-3 py-2 min-w-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        {activeTab === "brokers" ? "Min Deposit" : "Type"}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200 block truncate">
                        {activeTab === "brokers" ? minDeposit : marketType}
                    </span>
                </div>
                <div className="px-3 py-2 min-w-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        {activeTab === "brokers" ? "Max Leverage" : "Assets"}
                    </span>
                    <span className="font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200 block truncate">
                        {activeTab === "brokers" ? (maxLeverage || "N/A") : assets}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-200/60 dark:divide-white/5">
                <div className="px-3 py-2 min-w-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        Regulation
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate">
                        {regulation}
                    </span>
                </div>
                <div className="px-3 py-2 min-w-0">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">
                        Rating
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-gray-800 dark:text-gray-200 block truncate">
                        {rating.toFixed(1)} / 5.0
                    </span>
                </div>
            </div>
        </div>
    );
}
