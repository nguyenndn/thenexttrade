/**
 * Trading Style Assessment — data config.
 * Research-backed from mmfx-know-your-style (extracted from its client bundle).
 * 14 questions (English, verbatim), 8 archetypes, 6 core dimensions.
 * Keystone/moves paths are mapped to TheNextTrade routes (not MMFX links).
 */

export type ArchetypeId =
    | "reckless_gambler"
    | "analysis_paralyser"
    | "signal_dependent"
    | "indicator_stacker"
    | "emotional_revenge_trader"
    | "news_trader"
    | "system_hopper"
    | "brand_new_beginner";

export type DimensionId =
    | "process_routine"
    | "decisiveness"
    | "risk_discipline"
    | "emotional_control"
    | "consistency"
    | "independent_conviction";

export interface QuizOption {
    id: string;
    text: string;
    scoring: Partial<Record<ArchetypeId, number>>;
    dimensions?: Partial<Record<DimensionId, number>>;
}

export interface QuizQuestion {
    id: string;
    theme: string;
    text: string;
    options: QuizOption[];
}

export interface DimensionMeta {
    id: DimensionId;
    name: string;
    lowPole: string;
    highPole: string;
}

export interface TradingMove {
    label: string;
    why: string;
    href: string;
}

export interface Archetype {
    id: ArchetypeId;
    name: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    commonMistakes: string[];
    focus: string[];
    keystone: TradingMove;
    moves: TradingMove[];
}

export const DIMENSIONS: DimensionMeta[] = [
    {
        id: "process_routine",
        name: "Process & Routine",
        lowPole: "Wings it",
        highPole: "Routine-driven",
    },
    {
        id: "decisiveness",
        name: "Decisiveness",
        lowPole: "Hesitant",
        highPole: "Decisive",
    },
    {
        id: "risk_discipline",
        name: "Risk Discipline",
        lowPole: "Reckless",
        highPole: "Disciplined",
    },
    {
        id: "emotional_control",
        name: "Emotional Control",
        lowPole: "Tilt-prone",
        highPole: "Composed",
    },
    {
        id: "consistency",
        name: "Consistency",
        lowPole: "System-hopper",
        highPole: "Committed",
    },
    {
        id: "independent_conviction",
        name: "Independent Conviction",
        lowPole: "Dependent",
        highPole: "Independent",
    },
];

export const QUESTIONS: QuizQuestion[] = [
    {
        id: "q1",
        theme: "Experience",
        text: "How long have you been trading?",
        options: [
            {
                id: "a",
                text: "Less than 6 months",
                scoring: { brand_new_beginner: 3, reckless_gambler: 1 },
            },
            {
                id: "b",
                text: "6 months to 2 years",
                scoring: {
                    reckless_gambler: 1,
                    indicator_stacker: 1,
                    system_hopper: 1,
                    emotional_revenge_trader: 1,
                },
            },
            {
                id: "c",
                text: "2 to 5 years",
                scoring: {
                    system_hopper: 1,
                    indicator_stacker: 1,
                    analysis_paralyser: 1,
                    emotional_revenge_trader: 1,
                },
            },
            {
                id: "d",
                text: "5+ years",
                scoring: { analysis_paralyser: 2, news_trader: 1 },
                dimensions: { process_routine: 1 },
            },
        ],
    },
    {
        id: "q2",
        theme: "Style & Timeframe",
        text: "What's your typical trade duration on XAU/USD?",
        options: [
            {
                id: "a",
                text: "Minutes (in and out same hour)",
                scoring: { emotional_revenge_trader: 2, reckless_gambler: 1 },
                dimensions: { emotional_control: -1 },
            },
            {
                id: "b",
                text: "Hours (multiple times per day)",
                scoring: {
                    news_trader: 2,
                    indicator_stacker: 1,
                    emotional_revenge_trader: 1,
                },
            },
            {
                id: "c",
                text: "A day or two",
                scoring: {
                    indicator_stacker: 2,
                    analysis_paralyser: 1,
                    news_trader: 1,
                },
                dimensions: { process_routine: 1 },
            },
            {
                id: "d",
                text: "Days to weeks",
                scoring: { news_trader: 2, analysis_paralyser: 1 },
                dimensions: { process_routine: 1, emotional_control: 1 },
            },
            {
                id: "e",
                text: "I don't trade gold yet",
                scoring: { brand_new_beginner: 2 },
            },
        ],
    },
    {
        id: "q3",
        theme: "Your Edge",
        text: "When you enter a trade, what's the actual reason?",
        options: [
            {
                id: "a",
                text: "A specific setup from a system I follow",
                scoring: { analysis_paralyser: 2, system_hopper: 2 },
                dimensions: { independent_conviction: 2, process_routine: 1 },
            },
            {
                id: "b",
                text: "A signal someone else gave me",
                scoring: { signal_dependent: 3 },
                dimensions: { independent_conviction: -3 },
            },
            {
                id: "c",
                text: "Multiple indicators all lining up (RSI + MACD + MAs)",
                scoring: { indicator_stacker: 3, analysis_paralyser: 1 },
                dimensions: { independent_conviction: -1, decisiveness: -1 },
            },
            {
                id: "d",
                text: "A news event or economic release",
                scoring: { news_trader: 3 },
                dimensions: { independent_conviction: 1 },
            },
            {
                id: "e",
                text: "A feeling based on what I see",
                scoring: { reckless_gambler: 2, emotional_revenge_trader: 1 },
                dimensions: { risk_discipline: -1, process_routine: -1 },
            },
            {
                id: "f",
                text: "I just want to be in a trade",
                scoring: { reckless_gambler: 3, emotional_revenge_trader: 1 },
                dimensions: {
                    risk_discipline: -2,
                    emotional_control: -1,
                    process_routine: -2,
                },
            },
        ],
    },
    {
        id: "q4",
        theme: "Risk & Sizing",
        text: "How would you describe your usual position sizing?",
        options: [
            {
                id: "a",
                text: "Small and consistent (same % every trade)",
                scoring: { analysis_paralyser: 2, system_hopper: 1, news_trader: 1 },
                dimensions: { risk_discipline: 3, process_routine: 1 },
            },
            {
                id: "b",
                text: "Varies a little when I'm more confident",
                scoring: { emotional_revenge_trader: 1, news_trader: 1 },
                dimensions: { risk_discipline: 1 },
            },
            {
                id: "c",
                text: "Sometimes big when I'm sure",
                scoring: { reckless_gambler: 2, emotional_revenge_trader: 1 },
                dimensions: { risk_discipline: -1 },
            },
            {
                id: "d",
                text: "I size up when I am losing to win it back",
                scoring: { emotional_revenge_trader: 3, reckless_gambler: 2 },
                dimensions: { risk_discipline: -3, emotional_control: -2 },
            },
            {
                id: "e",
                text: "No real plan",
                scoring: {
                    reckless_gambler: 2,
                    brand_new_beginner: 1,
                    emotional_revenge_trader: 1,
                },
                dimensions: { risk_discipline: -2, process_routine: -2 },
            },
        ],
    },
    {
        id: "q5",
        theme: "Your Leak",
        text: "Which of these hurts you most?",
        options: [
            {
                id: "a",
                text: "Hesitating and missing trades I should have taken",
                scoring: { analysis_paralyser: 3 },
                dimensions: { decisiveness: -3 },
            },
            {
                id: "b",
                text: "Chasing price after the move is already gone",
                scoring: { reckless_gambler: 2, emotional_revenge_trader: 1 },
                dimensions: {
                    decisiveness: -1,
                    risk_discipline: -1,
                    emotional_control: -1,
                },
            },
            {
                id: "c",
                text: "Over-trading when there's nothing there",
                scoring: {
                    reckless_gambler: 2,
                    emotional_revenge_trader: 1,
                    news_trader: 1,
                },
                dimensions: { process_routine: -1, emotional_control: -1 },
            },
            {
                id: "d",
                text: "Blowing up after a losing streak",
                scoring: { emotional_revenge_trader: 3, reckless_gambler: 1 },
                dimensions: { emotional_control: -3, risk_discipline: -1 },
            },
            {
                id: "e",
                text: "Switching systems before any of them get a chance to work",
                scoring: { system_hopper: 4 },
                dimensions: { consistency: -3 },
            },
            {
                id: "f",
                text: "Indicators contradict each other and I freeze",
                scoring: { indicator_stacker: 3 },
                dimensions: { decisiveness: -2, independent_conviction: -1 },
            },
            {
                id: "g",
                text: "I haven't traded enough to know",
                scoring: { brand_new_beginner: 2 },
            },
        ],
    },
    {
        id: "q6",
        theme: "Signals",
        text: "How do you use signals from others?",
        options: [
            {
                id: "a",
                text: "I trade them blind, that's my whole approach",
                scoring: { signal_dependent: 3 },
                dimensions: { independent_conviction: -3 },
            },
            {
                id: "b",
                text: "I use them as one input alongside my own analysis",
                scoring: { news_trader: 1, analysis_paralyser: 1 },
                dimensions: { independent_conviction: 2 },
            },
            {
                id: "c",
                text: "I ignore them entirely",
                scoring: { indicator_stacker: 1, analysis_paralyser: 1, news_trader: 1 },
                dimensions: { independent_conviction: 2 },
            },
            {
                id: "d",
                text: "I don't follow any signal sources",
                scoring: { brand_new_beginner: 1, indicator_stacker: 1 },
                dimensions: { independent_conviction: 1 },
            },
        ],
    },
    {
        id: "q7",
        theme: "Psychology",
        text: "After a loss, what's most typical for you?",
        options: [
            {
                id: "a",
                text: "Calm — I review and move on",
                scoring: { analysis_paralyser: 1, news_trader: 1 },
                dimensions: { emotional_control: 3, process_routine: 1 },
            },
            {
                id: "b",
                text: "I want to win it back immediately",
                scoring: { emotional_revenge_trader: 3, reckless_gambler: 1 },
                dimensions: { emotional_control: -3, risk_discipline: -1 },
            },
            {
                id: "c",
                text: "I step away and come back fine later",
                scoring: { analysis_paralyser: 1 },
                dimensions: { emotional_control: 2 },
            },
            {
                id: "d",
                text: "I avoid trading for days",
                scoring: { analysis_paralyser: 2, system_hopper: 1 },
                dimensions: { emotional_control: -1, decisiveness: -1 },
            },
            {
                id: "e",
                text: "I haven't lost meaningfully yet",
                scoring: { brand_new_beginner: 2 },
            },
        ],
    },
    {
        id: "q8",
        theme: "Motivation",
        text: "Why are you trading?",
        options: [
            {
                id: "a",
                text: "Build a consistent income",
                scoring: {},
                dimensions: { process_routine: 1 },
            },
            {
                id: "b",
                text: "Supplement what I earn elsewhere",
                scoring: {},
            },
            {
                id: "c",
                text: "Build up for a prop firm",
                scoring: { analysis_paralyser: 1 },
                dimensions: { process_routine: 1 },
            },
            {
                id: "d",
                text: "Go full-time eventually",
                scoring: { indicator_stacker: 1, news_trader: 1 },
            },
            {
                id: "e",
                text: "Curious / exploring",
                scoring: { brand_new_beginner: 2 },
            },
            {
                id: "f",
                text: "Not sure yet",
                scoring: { brand_new_beginner: 2 },
            },
        ],
    },
    {
        id: "q9",
        theme: "Your Routine",
        text: "Before you place a trade, how often is the plan — entry, stop, target — decided in advance?",
        options: [
            {
                id: "a",
                text: "Always — it's written down before I click",
                scoring: { analysis_paralyser: 1 },
                dimensions: { process_routine: 3, risk_discipline: 2 },
            },
            {
                id: "b",
                text: "Usually, at least clear in my head",
                scoring: {},
                dimensions: { process_routine: 1, risk_discipline: 1 },
            },
            {
                id: "c",
                text: "Sometimes — depends on the setup",
                scoring: {},
                dimensions: { process_routine: 0 },
            },
            {
                id: "d",
                text: "Rarely — I decide as it unfolds",
                scoring: { reckless_gambler: 1, emotional_revenge_trader: 1 },
                dimensions: { process_routine: -2, risk_discipline: -1 },
            },
        ],
    },
    {
        id: "q10",
        theme: "Review & Journaling",
        text: "Do you journal your trades and review them?",
        options: [
            {
                id: "a",
                text: "Every trade, reviewed regularly",
                scoring: { analysis_paralyser: 1 },
                dimensions: { process_routine: 3, consistency: 1 },
            },
            {
                id: "b",
                text: "On and off",
                scoring: {},
                dimensions: { process_routine: 1 },
            },
            {
                id: "c",
                text: "I've tried but don't keep it up",
                scoring: { system_hopper: 1 },
                dimensions: { process_routine: -1, consistency: -1 },
            },
            {
                id: "d",
                text: "No, I don't journal",
                scoring: { reckless_gambler: 1, brand_new_beginner: 1 },
                dimensions: { process_routine: -2 },
            },
        ],
    },
    {
        id: "q11",
        theme: "Commitment",
        text: "You've followed a strategy for 8 trades and you're slightly down. What's your move?",
        options: [
            {
                id: "a",
                text: "8 trades tells me nothing — keep going to a real sample",
                scoring: { analysis_paralyser: 1 },
                dimensions: { consistency: 3, emotional_control: 1 },
            },
            {
                id: "b",
                text: "Tweak the rules and continue",
                scoring: { indicator_stacker: 1 },
                dimensions: { consistency: 0 },
            },
            {
                id: "c",
                text: "Start looking for a better strategy",
                scoring: { system_hopper: 3 },
                dimensions: { consistency: -3 },
            },
            {
                id: "d",
                text: "Stop trading until I feel confident again",
                scoring: { analysis_paralyser: 1 },
                dimensions: { consistency: -1, decisiveness: -2 },
            },
        ],
    },
    {
        id: "q12",
        theme: "Decisiveness",
        text: "A setup you trade appears, but it's only about 80% textbook. What do you do?",
        options: [
            {
                id: "a",
                text: "Take it — no setup is ever 100%",
                scoring: { news_trader: 1 },
                dimensions: { decisiveness: 3 },
            },
            {
                id: "b",
                text: "Take it, but smaller",
                scoring: {},
                dimensions: { decisiveness: 2, risk_discipline: 1 },
            },
            {
                id: "c",
                text: "Wait for more confirmation",
                scoring: { analysis_paralyser: 2 },
                dimensions: { decisiveness: -2 },
            },
            {
                id: "d",
                text: "Skip it — I only take perfect setups",
                scoring: { analysis_paralyser: 3 },
                dimensions: { decisiveness: -3 },
            },
        ],
    },
    {
        id: "q13",
        theme: "Under Pressure",
        text: "Gold spikes 30 pips against you seconds after you enter — your stop is not hit. What actually happens?",
        options: [
            {
                id: "a",
                text: "Nothing — my stop is set and I leave it alone",
                scoring: { analysis_paralyser: 1 },
                dimensions: { risk_discipline: 3, emotional_control: 2 },
            },
            {
                id: "b",
                text: "I watch it closely, ready to bail out early",
                scoring: {},
                dimensions: { emotional_control: -1, decisiveness: -1 },
            },
            {
                id: "c",
                text: "I move my stop further to give it room",
                scoring: { emotional_revenge_trader: 2, reckless_gambler: 1 },
                dimensions: { risk_discipline: -3, emotional_control: -1 },
            },
            {
                id: "d",
                text: "I add to the position for a better average",
                scoring: { reckless_gambler: 2, emotional_revenge_trader: 1 },
                dimensions: { risk_discipline: -3, emotional_control: -2 },
            },
        ],
    },
    {
        id: "q14",
        theme: "Independence",
        text: "If every signal group and indicator vanished tomorrow, could you find and manage a trade on a bare XAU/USD chart?",
        options: [
            {
                id: "a",
                text: "Yes, comfortably — I read structure myself",
                scoring: { analysis_paralyser: 1 },
                dimensions: { independent_conviction: 3, process_routine: 1 },
            },
            {
                id: "b",
                text: "Mostly, but I'd be slower",
                scoring: {},
                dimensions: { independent_conviction: 1 },
            },
            {
                id: "c",
                text: "Not really — I lean on my tools and signals",
                scoring: { indicator_stacker: 1, signal_dependent: 1 },
                dimensions: { independent_conviction: -2 },
            },
            {
                id: "d",
                text: "No — I wouldn't know where to start",
                scoring: { signal_dependent: 2, brand_new_beginner: 1 },
                dimensions: { independent_conviction: -3 },
            },
        ],
    },
];

export const ARCHETYPES: Record<ArchetypeId, Archetype> = {
    reckless_gambler: {
        id: "reckless_gambler",
        name: "The Reckless Gambler",
        summary:
            "High risk tolerance, no system, chases price, blows accounts and reloads.",
        strengths: ["Bold and takes action", "Isn't afraid of the market", "High engagement"],
        weaknesses: ["No edge", "No risk management", "No patience"],
        commonMistakes: [
            "Revenge trading after losses",
            "Doubling down on losing positions",
            "Sizing up to chase a feeling",
        ],
        focus: [
            "Build a system before sizing up",
            "Capital preservation comes before profit",
            "Pre-defined position sizing rules",
        ],
        keystone: {
            label: "Managing & Routine module",
            why: "Build the risk rules first — fixed sizing and hard stops before anything else.",
            href: "/academy",
        },
        moves: [
            {
                label: "Set Trading Rules",
                why: "Pre-define your max risk per trade and daily loss limit.",
                href: "/dashboard/rules",
            },
            {
                label: "Journal Every Trade",
                why: "Replace the 'feeling' with data on what actually works.",
                href: "/dashboard/journal",
            },
        ],
    },
    analysis_paralyser: {
        id: "analysis_paralyser",
        name: "The Analysis Paralyser",
        summary:
            "Over-thinks every setup, demands 100% confirmation, misses 80% of valid trades.",
        strengths: [
            "Thorough",
            "Low impulsivity",
            "Rarely takes obviously bad trades",
        ],
        weaknesses: [
            "Hesitation costs opportunities",
            "Chronic FOMO regret after missed moves",
            "Decision-paralysis at the chart",
        ],
        commonMistakes: [
            "Requiring more confirmation signals than the market ever gives",
            "Waiting for the 'perfect' setup that never arrives",
            "Talking themselves out of valid trades",
        ],
        focus: [
            "Probabilistic thinking — no setup is ever 100%",
            "Defined entry criteria with a maximum count of conditions",
            "Trade execution practice on demo, not endless backtesting",
        ],
        keystone: {
            label: "Backtest a strategy",
            why: "Prove your rules work, so you stop demanding certainty that never comes.",
            href: "/dashboard/strategies",
        },
        moves: [
            {
                label: "Define a Strategy",
                why: "Externalise your entry criteria with a maximum count of conditions.",
                href: "/dashboard/strategies",
            },
            {
                label: "Journal Your Trades",
                why: "Review real executions instead of endless backtesting.",
                href: "/dashboard/journal",
            },
        ],
    },
    signal_dependent: {
        id: "signal_dependent",
        name: "The Signal Dependent",
        summary: "Trades entirely off signals, no independent analysis skill.",
        strengths: [
            "Humble about own ability",
            "Willing to follow proven systems",
            "Disciplined when given clear instructions",
        ],
        weaknesses: [
            "No transferable skill",
            "Lost when signals are absent",
            "Can't tell good signals from bad ones",
        ],
        commonMistakes: [
            "Taking signals without understanding why they were given",
            "Following multiple signal providers with contradictory calls",
            "Blaming the signal provider when trades lose",
        ],
        focus: [
            "Learning to validate signals against own analysis before executing",
            "Building independent reasoning, not just execution",
            "Understanding the structure behind each signal",
        ],
        keystone: {
            label: "Learn Market Structure",
            why: "Turn signal-following into a skill you actually own.",
            href: "/academy",
        },
        moves: [
            {
                label: "Start the Academy Course",
                why: "Build the foundation to validate signals against your own analysis.",
                href: "/academy",
            },
            {
                label: "Read Market Analysis",
                why: "Understand the structure behind each signal before executing.",
                href: "/knowledge",
            },
        ],
    },
    indicator_stacker: {
        id: "indicator_stacker",
        name: "The Indicator Stacker",
        summary:
            "Trades from a chart covered in 8+ indicators, mistakes complexity for edge, never sees clean price action.",
        strengths: ["Analytical", "Willing to study", "Comfortable with technical concepts"],
        weaknesses: [
            "Lagging indicators describe the past, they don't predict price",
            "Confluence becomes paralysis",
            "Can't read raw structure",
        ],
        commonMistakes: [
            "Refusing to enter unless RSI, MACD, Stochastic and a moving average all agree",
            "Adding more indicators when a system stops working",
            "Mistaking indicator confluence for market confluence",
        ],
        focus: [
            "Reading raw market structure — highs, lows, order flow, liquidity",
            "Deleting indicators that don't change your decision",
            "Trusting price over derivatives of price",
        ],
        keystone: {
            label: "Reading Price module",
            why: "Trade clean structure instead of a wall of contradicting indicators.",
            href: "/academy",
        },
        moves: [
            {
                label: "Start the Academy Course",
                why: "Learn to read price action and structure on a clean chart.",
                href: "/academy",
            },
            {
                label: "Streamline Your Charts",
                why: "Delete indicators that don't change your decision.",
                href: "/dashboard/strategies",
            },
        ],
    },
    emotional_revenge_trader: {
        id: "emotional_revenge_trader",
        name: "The Emotional Revenge Trader",
        summary:
            "Wins lead to overconfidence, losses lead to tilt, account swings wildly between green and red.",
        strengths: [
            "Highly engaged",
            "Learns fast when not on tilt",
            "Honest about own emotional pattern when calm",
        ],
        weaknesses: [
            "Poor emotional regulation under drawdown",
            "Risk management collapses when emotional",
            "Sizes up to recover losses",
        ],
        commonMistakes: [
            "Increasing position size after losses to 'win it back'",
            "Trading immediately after a loss instead of stepping back",
            "Treating one losing trade as a sign the whole system is broken",
        ],
        focus: [
            "Pre-defined daily loss limits with mandatory cool-down",
            "Mandatory break after two consecutive losses",
            "Journaling emotional state alongside trade outcomes",
        ],
        keystone: {
            label: "Psychology module",
            why: "Pre-commit your reactions so a loss cannot hijack you.",
            href: "/academy",
        },
        moves: [
            {
                label: "Set Trading Rules",
                why: "Pre-defined daily loss limits with a mandatory cool-down.",
                href: "/dashboard/rules",
            },
            {
                label: "Track Your Psychology",
                why: "Journal emotional state alongside trade outcomes.",
                href: "/dashboard/psychology",
            },
        ],
    },
    news_trader: {
        id: "news_trader",
        name: "The News Trader",
        summary:
            "Lives for NFP, FOMC, CPI — trades the volatility around scheduled events, sits on hands the rest of the time.",
        strengths: [
            "Understands macro drivers",
            "Comfortable in fast markets",
            "Real edge during high-impact releases",
        ],
        weaknesses: [
            "Boredom-induced overtrading outside news windows",
            "Gets caught by stop hunts in the first 30 seconds of a release",
            "Treats every red headline as a tradable event",
        ],
        commonMistakes: [
            "Entering market orders into a news spike before liquidity returns",
            "Filling at the worst possible price after a stop run",
            "Holding through the second leg of a reversal because the news 'should have' moved it the other way",
        ],
        focus: [
            "Layering structure-based entries on top of news catalysts",
            "Waiting for the post-news pullback rather than chasing the initial spike",
            "Defining 'no-trade' windows around the release itself",
        ],
        keystone: {
            label: "Economic Calendar",
            why: "Plan around the catalysts instead of chasing every headline.",
            href: "/tools/economic-calendar",
        },
        moves: [
            {
                label: "Use the Economic Calendar",
                why: "Plan around scheduled catalysts instead of chasing every headline.",
                href: "/tools/economic-calendar",
            },
            {
                label: "Join the Community",
                why: "Study how structure-based entries layer on top of news catalysts.",
                href: "/community",
            },
        ],
    },
    system_hopper: {
        id: "system_hopper",
        name: "The System Hopper",
        summary:
            "Tries a new strategy every couple of weeks because nothing seems to work long enough to compound. Owns five courses, finished none.",
        strengths: [
            "High learning appetite",
            "Willing to invest in education",
            "Technically literate",
        ],
        weaknesses: [
            "Mistakes normal drawdown for 'the system doesn't work'",
            "Never gives any approach the sample size it needs to prove itself",
            "Lacks the patience to compound an edge",
        ],
        commonMistakes: [
            "Abandoning a strategy after 5–10 trades",
            "Buying the next course before finishing the current one",
            "Treating every losing streak as a signal to switch frameworks",
        ],
        focus: [
            "Pick one framework and trade it for 100+ trades minimum before judging",
            "Journal every trade so you have real data, not feelings, to evaluate against",
            "Stop buying the next thing until this one is finished",
        ],
        keystone: {
            label: "Commit to one system",
            why: "One framework, traded long enough to actually compound.",
            href: "/dashboard/strategies",
        },
        moves: [
            {
                label: "Define One Strategy",
                why: "Pick a single framework and trade it for 100+ trades before judging.",
                href: "/dashboard/strategies",
            },
            {
                label: "Journal Every Trade",
                why: "Collect real data, not feelings, to evaluate the approach against.",
                href: "/dashboard/journal",
            },
        ],
    },
    brand_new_beginner: {
        id: "brand_new_beginner",
        name: "The Brand New Beginner",
        summary: "No system, no losses yet, exploring trading for the first time.",
        strengths: ["Open mind", "No entrenched bad habits", "Low capital at risk"],
        weaknesses: [
            "No foundation",
            "Susceptible to 'guru' marketing",
            "Underestimates the learning curve",
        ],
        commonMistakes: [
            "Starting real-money trading before understanding basic price action",
            "Skipping the demo phase to 'feel the real pressure'",
            "Following the loudest voice on social media",
        ],
        focus: [
            "Foundational education before any live trading",
            "Demo account for 30+ days minimum",
            "Learning to read structure before learning entries",
        ],
        keystone: {
            label: "Start at Foundations",
            why: "Build the base before you put any real money at risk.",
            href: "/academy",
        },
        moves: [
            {
                label: "Start the Academy Course",
                why: "Foundational education before any live trading.",
                href: "/academy",
            },
            {
                label: "Read Beginner Guides",
                why: "Learn to read price structure before learning entries.",
                href: "/knowledge",
            },
        ],
    },
};
