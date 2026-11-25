export interface FAQItem {
    question: string;
    answer: string;
}

export const MEMBERSHIP_FAQS: FAQItem[] = [
    {
        question: "Is TheNextTrade really free? Why do I never pay monthly or course fees?",
        answer: "Yes! You never pay TheNextTrade any subscription, course, or signal fees. Our core platform, calculators, and 7-day trial are 100% free with no credit card required. To keep full VIP access permanently open (AI Coach, MT5 Auto-Sync, and Automated EAs), you simply fund your own broker account with $200. That deposit remains 100% yours in your own name, and you can trade or withdraw it anytime.",
    },
    {
        question: "What's the catch? How does TheNextTrade make money if VIP is free?",
        answer: "Zero catch. We operate as an authorized Introducing Broker (IB) partner with regulated brokers (Exness, XM, Vantage Markets, RoboForex). When you execute trades, the broker compensates us directly from their standard spread at zero added cost to you. We succeed only when you trade with strict risk management and stay profitable for the long term.",
    },
    {
        question: "Is my $200 deposit safe? Can I withdraw it anytime?",
        answer: "Your capital is held directly in your personal account at Tier-1 regulated brokers. TheNextTrade never receives, touches, or manages your funds. You retain 100% custody and can withdraw your principal or profits at any moment without penalty.",
    },
    {
        question: "What if I already have an account with the broker?",
        answer: "You can easily link your existing broker profile by changing the Partner ID/IB code or opening a new sub-account under our link. Once verified, your full TheNextTrade VIP membership unlocks immediately.",
    },
];

export const PLATFORM_FAQS: FAQItem[] = [
    {
        question: "How do I sync MT5 trades automatically? Do I need a VPS or master password?",
        answer: "Never share your master trading password. You have two flexible ways to sync Demo or Live MT5 accounts: (1) Live EA Sync on PC/VPS using our GSN Trade Manager EA and a Sync Key (zero password required), or (2) 1-Click Cloud Sync directly from mobile/web using your read-only MT5 Investor Password (which cannot place trades or withdraw funds).",
    },
    {
        question: "What is the Weekly Coach & 10-Trade Action Plan?",
        answer: "The Weekly Coach algorithm audits your actual trade execution for psychological leaks — like revenge sizing, moving stops, or off-session FOMO — and prescribes one strict 10-trade improvement focus each week.",
    },
    {
        question: "How do I unlock the MT5 Expert Advisors for free?",
        answer: "Our MT5 Expert Advisors (GoldScalperNinja, GSN Shadow Matrix, Trade Manager) are available for $0 upfront cost through our verified broker partner paths. Once your account qualifies, license keys and downloads appear inside your dashboard.",
    },
    {
        question: "Can I connect multiple accounts or Prop Firms?",
        answer: "Yes! You can connect multiple live, demo, and prop firm accounts (like FTMO, Funded Next) to your journal. The dashboard automatically segments your metrics per account, session, and strategy.",
    },
];

export const ALL_FAQS: FAQItem[] = [...MEMBERSHIP_FAQS, ...PLATFORM_FAQS];
