export const CANONICAL_PRODUCTS = [
    {
        id: "goldscalperninja",
        slug: "goldscalperninja",
        name: "GoldScalperNinja",
        description: "Flagship Gold XAUUSD EA",
    },
    {
        id: "trade-manager",
        slug: "trade-manager",
        name: "Trade Manager",
        description: "Execution & Risk Management Utility",
    },
    {
        id: "gsn-phoenix-grid",
        slug: "shadow-matrix",
        name: "Shadow Matrix",
        description: "Asymmetric Dual-Grid & Counter-Hedge EA",
    },
    {
        id: "764eef7e-4400-4411-801d-98a3d1127421",
        slug: "snr-system",
        name: "SNR System",
        description: "Malaysian SNR & ICT OTE Semi-Auto EA",
    },
] as const;

export const FRESHNESS_THRESHOLDS = {
    FRESH_HOURS: 24,
    STALE_HOURS: 168, // 7 days
} as const;

export const DEFAULT_PAGE_SIZE = 25;
export const ALLOWED_PAGE_SIZES = [25, 50, 100] as const;
