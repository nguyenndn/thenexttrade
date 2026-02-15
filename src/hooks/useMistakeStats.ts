import useSWR from 'swr';
import { format } from "date-fns";

interface MistakeData {
    mistakeStats: Array<{
        code: string;
        name: string;
        category: string;
        severity: string;
        emoji: string;
        count: number;
        totalPnL: number;
        avgPnL: number;
        winRate: number;
    }>;
    totalMistakes: number;
    mostCostlyMistake: string | null;
    mostFrequentMistake: string | null;
    mistakesByCategory: Record<string, number>;
    tradesWithMistakes: number;
    tradesWithoutMistakes: number;
    cleanTradeWinRate: number;
    mistakeTradeWinRate: number;
    costOfMistakes: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMistakeStats(startDate: Date, endDate: Date) {
    const params = new URLSearchParams({
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
    });

    const { data, error, isLoading } = useSWR<MistakeData>(
        `/api/analytics/mistakes?${params.toString()}`,
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000, // Deduplicate requests within 1 minute
        }
    );

    return {
        data,
        isLoading,
        isError: error,
    };
}
