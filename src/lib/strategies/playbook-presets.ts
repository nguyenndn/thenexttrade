export interface PlaybookPreset {
    id: string;
    name: string;
    description: string;
    rules: string;
    color: string;
    setupType: string;
    timeframes: string[];
    pairs: string[];
    idealEntry: string;
    idealStopLoss: string;
    idealTakeProfit: string;
    riskRewardMin: number;
    referenceImages: string[];
}

export const PLAYBOOK_PRESETS: PlaybookPreset[] = [
    {
        id: "smc-london-sweep",
        name: "SMC London Liquidity Sweep",
        description: "Quét thanh khoản đỉnh/đáy phiên Á vào đầu phiên London và đảo chiều theo Market Structure Shift (MSS).",
        rules: "1. Xác định Range phiên Á (Asian High / Asian Low)\n2. Đầu phiên London giá quét qua đỉnh/đáy Á\n3. Chờ nến M15 tạo Market Structure Shift (MSS) đảo chiều\n4. Vào lệnh Limit tại 50% FVG hoặc Order Block tạo ra cú quét",
        color: "#00C888",
        setupType: "Reversal",
        timeframes: ["H4", "M15", "M5"],
        pairs: ["XAUUSD", "EURUSD", "GBPUSD"],
        idealEntry: "50% Fair Value Gap (FVG) sau khi có MSS M15",
        idealStopLoss: "Trên đỉnh/đáy râu nến quét thanh khoản + 3 pips",
        idealTakeProfit: "Đáy/Đỉnh phiên Á đối diện (Liquidity Target)",
        riskRewardMin: 3.0,
        referenceImages: [],
    },
    {
        id: "break-and-retest",
        name: "Break & Retest Trend Continuation",
        description: "Bắt nhịp hồi retest vùng cản then chốt sau khi giá phá vỡ cấu trúc và tiếp diễn xu hướng chính.",
        rules: "1. Xu hướng khung H4 rõ ràng (Higher Highs / Lower Lows)\n2. Giá phá vỡ dứt khoát qua Key Level / Đỉnh đáy cũ\n3. Chờ giá hồi về Retest vùng phá vỡ (Breakout Zone)\n4. Nến M15 xuất hiện nến từ chối (Pinbar / Bullish Engulfing)",
        color: "#3B82F6",
        setupType: "Continuation",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["NAS100", "US30", "XAUUSD", "EURUSD"],
        idealEntry: "Retest vùng phá vỡ (Support/Resistance Flip Zone)",
        idealStopLoss: "Sau vùng cản vừa retest + buffer an toàn",
        idealTakeProfit: "Đỉnh/đáy tiếp theo trên khung H4",
        riskRewardMin: 2.5,
        referenceImages: [],
    },
    {
        id: "asian-range-squeeze",
        name: "Asian Range Squeeze & Expansion",
        description: "Khai thác sự nén biên độ (volatility squeeze) trong phiên Á để bắt sóng bung volume đầu phiên London/New York.",
        rules: "1. Biên độ phiên Á dao động hẹp (< 30 pips trên Forex / < 100 pips trên Vàng)\n2. Đặt cảnh báo giá 2 đầu biên độ\n3. Khi nến M15 đóng thân dứt khoát ra ngoài biên độ kèm volume tăng vọt\n4. Vào lệnh theo hướng breakout",
        color: "#F59E0B",
        setupType: "Breakout",
        timeframes: ["M15", "M5"],
        pairs: ["GBPUSD", "EURUSD", "BTCUSD"],
        idealEntry: "Vào ngay khi nến M15 đóng ngoài biên độ hoặc retest biên",
        idealStopLoss: "Giữa Range phiên Á (Midpoint)",
        idealTakeProfit: "2x Biên độ Range phiên Á (Measured Move)",
        riskRewardMin: 2.0,
        referenceImages: [],
    },
    {
        id: "supply-demand-flip",
        name: "Supply / Demand Zone Flip",
        description: "Bắt điểm xoay chiều khi một vùng Demand mạnh bị phá vỡ và chuyển hóa thành Supply (hoặc ngược lại).",
        rules: "1. Xác định vùng Supply/Demand mạnh trên H1/H4\n2. Giá phá vỡ mạnh qua vùng đó bằng nến Marubozu/Displacement\n3. Vùng cũ đảo vai trò (Demand -> Supply Flip)\n4. Chờ giá hồi về kiểm định và xác nhận đảo chiều trên M15",
        color: "#8B5CF6",
        setupType: "Reversal",
        timeframes: ["H4", "H1", "M15"],
        pairs: ["XAUUSD", "USDJPY", "EURJPY"],
        idealEntry: "Chạm mép vùng Flip Zone",
        idealStopLoss: "Phía sau vùng Flip Zone",
        idealTakeProfit: "Vùng Supply/Demand tiếp theo trên H1",
        riskRewardMin: 3.0,
        referenceImages: [],
    },
    {
        id: "ict-silver-bullet",
        name: "ICT Silver Bullet Scalp",
        description: "Khung giờ vàng ICT (10:00 - 11:00 AM NY Session / 03:00 - 04:00 AM London) săn FVG 1-min / 5-min.",
        rules: "1. Chỉ giao dịch trong khung giờ Silver Bullet\n2. Giá quét thanh khoản gần nhất (BSL / SSL)\n3. Xuất hiện Market Structure Shift (MSS) kèm Displacement tạo FVG\n4. Đặt Limit tại FVG",
        color: "#06B6D4",
        setupType: "Scalp",
        timeframes: ["M5", "M1"],
        pairs: ["NAS100", "US30", "XAUUSD"],
        idealEntry: "100% lấp đầy FVG",
        idealStopLoss: "Trên đỉnh/đáy cây nến tạo Displacement",
        idealTakeProfit: "Target 10 - 15 pips hoặc Liquidity Pool gần nhất",
        riskRewardMin: 2.0,
        referenceImages: [],
    },
];
