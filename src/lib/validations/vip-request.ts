import { z } from "zod";

export const SUPPORTED_BROKERS = [
    "EXNESS",
    "VANTAGE",
    "VTMARKETS",
    "ULTIMAMARKETS",
] as const;
export type SupportedBroker = (typeof SUPPORTED_BROKERS)[number];

export const BROKER_INFO: Record<
    SupportedBroker,
    {
        name: string;
        logo: string;
        affiliateUrl: string;
        ibCode: string;
        color: string;
        minDeposit: number;
        accountType: string;
        leverage: string;
        requiresCountry: boolean;
        requiresFullName: boolean;
        registerGuide: {
            platform: string;
            accountType: string;
            leverage: string;
            currency: string;
            minDeposit: number;
            steps: string[];
        };
        ibTransferGuide: {
            steps: string[];
            note?: string;
            emails?: { to: string; cc?: string; subject: string; body: string };
        };
    }
> = {
    EXNESS: {
        name: "Exness",
        logo: "/images/brokers/exness.png",
        affiliateUrl: "https://one.exnessonelink.com/a/1ewjh1ww32",
        ibCode: "1ewjh1ww32",
        color: "#FFC107",
        minDeposit: 200,
        accountType: "Standard",
        leverage: "1:2000",
        requiresCountry: true,
        requiresFullName: true,
        registerGuide: {
            platform: "MT4/MT5 real account",
            accountType: "Standard",
            leverage: "1:2000",
            currency: "USD",
            minDeposit: 200,
            steps: [
                "Open an MT4/MT5 real account platform",
                "Choose the \"Standard\" type",
                "Leverage: 1:2000",
                "Select your currency (USD)",
                "Fill account name, password for login on MT4/MT5",
                "Minimum deposit of $200 USD",
            ],
        },
        ibTransferGuide: {
            steps: [
                "Contact Exness Supporter on your Dashboard area",
                "Request to change IB to our partner",
                "Provide Partner IB link: https://one.exnessonelink.com/a/1ewjh1ww32",
                "Provide Partner IB code: 1ewjh1ww32",
                "Wait for the confirmation email from Exness",
            ],
            note: "You need to open a new additional trading account when changing IB. You can also use a new email to create a new account (can reuse the old profile).",
        },
    },
    VANTAGE: {
        name: "VantageMarkets",
        logo: "/images/brokers/vantage.png",
        affiliateUrl:
            "https://www.vantagemarkets.com/forex-trading/forex-trading-account/?affid=111451",
        ibCode: "111451",
        color: "#E31937",
        minDeposit: 200,
        accountType: "Standard STP",
        leverage: "1:500",
        requiresCountry: true,
        requiresFullName: true,
        registerGuide: {
            platform: "MT4/MT5 real account",
            accountType: "Standard STP",
            leverage: "1:500",
            currency: "USD",
            minDeposit: 200,
            steps: [
                "Open a VantageMarkets MT4/MT5 real account",
                "Choose the \"Standard STP\" account type",
                "Leverage: 1:500",
                "Select your currency (USD)",
                "Fill account name, password for login on MT4/MT5",
                "Minimum deposit of $200 USD",
            ],
        },
        ibTransferGuide: {
            steps: [
                "Send an email from your registered email with VantageMarkets",
                "Wait for the confirmation email from VantageMarkets",
            ],
            note: "Use IB Number 111451 if you trade with GBP/EUR, or 142655 if you trade with USD.",
            emails: {
                to: "support@vantagemarkets.com",
                cc: "izzat.my@vantagemarkets.com",
                subject: "Account Reassign - Client Email",
                body: "Hi, Kindly assist to reassign my account under IB Number (111451 or 142655) as I want to trade with him. Thanks.",
            },
        },
    },
    VTMARKETS: {
        name: "VTMarkets",
        logo: "/images/brokers/vtmarkets.png",
        affiliateUrl:
            "https://www.vtmarkets.com/get-trading/forex-trading-account/?affid=830422",
        ibCode: "830422",
        color: "#1E3A5F",
        minDeposit: 200,
        accountType: "Standard STP",
        leverage: "1:500",
        requiresCountry: true,
        requiresFullName: true,
        registerGuide: {
            platform: "MT4/MT5 real account",
            accountType: "Standard STP",
            leverage: "1:500",
            currency: "USD",
            minDeposit: 200,
            steps: [
                "Open a VTMarkets MT4/MT5 real account",
                "Choose the \"Standard STP\" account type",
                "Leverage: 1:500",
                "Select your currency (USD)",
                "Fill account name, password for login on MT4/MT5",
                "Minimum deposit of $200 USD",
            ],
        },
        ibTransferGuide: {
            steps: [
                "Send an email from your registered email with VTMarkets",
                "Wait for the confirmation email from VTMarkets",
            ],
            emails: {
                to: "info@vtmarkets.com",
                subject: "Account Reassign - Client Email",
                body: "Hi, Kindly assist to reassign my account under IB Number (830422) as I want to trade with him. Thanks.",
            },
        },
    },
    ULTIMAMARKETS: {
        name: "Ultima Markets",
        logo: "/images/brokers/ultima.png",
        affiliateUrl:
            "https://www.ultimamarkets.com/accounts/open-trading-account/?affid=NzIzNDkwMw==",
        ibCode: "NzIzNDkwMw==",
        color: "#7C3AED",
        minDeposit: 200,
        accountType: "Standard",
        leverage: "1:500",
        requiresCountry: true,
        requiresFullName: true,
        registerGuide: {
            platform: "MT4/MT5 real account",
            accountType: "Standard",
            leverage: "1:500",
            currency: "USD",
            minDeposit: 200,
            steps: [
                "Open an Ultima Markets MT4/MT5 real account",
                "Choose the \"Standard\" account type",
                "Leverage: 1:500",
                "Select your currency (USD)",
                "Fill account name, password for login on MT4/MT5",
                "Minimum deposit of $200 USD",
            ],
        },
        ibTransferGuide: {
            steps: [
                "Send an email from your registered email with Ultima Markets",
                "Wait for the confirmation email from Ultima Markets",
            ],
            emails: {
                to: "info@ultimamarkets.com",
                subject: "Please help me transfer my Account to Affiliate - 7234903",
                body: "Hi, Kindly assist to reassign my account under IB Number (7234903) as I want to trade with him. Thanks.",
            },
        },
    },
};

export const vipRequestSchema = z
    .object({
        broker: z.enum(SUPPORTED_BROKERS),
        accountNumber: z.string().min(1, "Account number is required").max(50),
        balance: z.string().min(1, "Balance is required").max(50),
        email: z.string().email("Invalid email address"),
        telegramId: z.string().min(1, "Telegram ID is required").max(100),
        fullName: z.string().max(100).optional(),
        country: z.string().max(100).optional(),
        screenshotUrl: z.string().url().max(500).optional().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
        const info = BROKER_INFO[data.broker];

        if (info.requiresFullName && !data.fullName?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Full name is required for this broker",
                path: ["fullName"],
            });
        }

        if (info.requiresCountry && !data.country?.trim()) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Country is required for this broker",
                path: ["country"],
            });
        }
    });

export type VipRequestInput = z.infer<typeof vipRequestSchema>;
