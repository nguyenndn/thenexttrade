/**
 * Welcome Email Templates
 *
 * Defines the welcome email sequence for new users (D0, D1, D3).
 * Actual sending is handled by:
 *   - D0: onboarding.server.ts (on completion)
 *   - D1/D3: activation-reminders cron job
 *
 * Both use sendEmail() from email.service.ts (Resend SMTP).
 */

export interface WelcomeEmailTemplate {
    id: string;
    subject: string;
    triggerAfterHours: number;
    /** Only send if user has no trade data */
    requiresNoTrades: boolean;
    body: {
        headline: string;
        preheader: string;
        bodyText: string;
        ctaText: string;
        ctaHref: string;
    };
}


/**
 * D0: Sent immediately after registration completes
 */
export const WELCOME_EMAIL_D0: WelcomeEmailTemplate = {
    id: "welcome_d0",
    subject: "Welcome to TheNextTrade — Let's set up your edge 🚀",
    triggerAfterHours: 0,
    requiresNoTrades: false,
    body: {
        headline: "Welcome to TheNextTrade!",
        preheader:
            "Your trading command center is ready. Here's how to get started.",
        bodyText:
            "You've just joined a community of disciplined traders who track, analyze, and improve their performance every day.\n\nHere are your first 3 steps:\n\n1. Connect your MT5 account for automatic trade sync\n2. Explore Academy to learn proven strategies\n3. Log your first trade to unlock your dashboard\n\nYour dashboard is waiting — let's make it come alive.",
        ctaText: "Open Your Dashboard →",
        ctaHref: "/dashboard",
    },
};

/**
 * D1: Sent 24h after registration IF user hasn't logged any trades
 */
export const WELCOME_EMAIL_D1: WelcomeEmailTemplate = {
    id: "welcome_d1",
    subject: "Your dashboard is waiting 📊",
    triggerAfterHours: 24,
    requiresNoTrades: true,
    body: {
        headline: "Your dashboard is waiting for you",
        preheader:
            "Connect your account to start tracking trades automatically.",
        bodyText:
            "Hey! Just a quick reminder — your TheNextTrade dashboard is set up and ready to go.\n\nThe fastest way to get started is connecting your MT5 account. Once connected, all your trades sync automatically — no manual work needed.\n\nAlternatively, you can log trades manually from the Trading Journal.",
        ctaText: "Connect Your Account →",
        ctaHref: "/dashboard/accounts",
    },
};

/**
 * D3: Sent 72h after registration IF user still hasn't logged any trades
 */
export const WELCOME_EMAIL_D3: WelcomeEmailTemplate = {
    id: "welcome_d3",
    subject: "Here's what you're missing 👀",
    triggerAfterHours: 72,
    requiresNoTrades: true,
    body: {
        headline: "Here's what your dashboard looks like with data",
        preheader:
            "Performance charts, AI insights, Trade Score — all unlocked with your first trade.",
        bodyText:
            "After just one trade logged, your dashboard unlocks:\n\n• Performance charts with cumulative P&L\n• AI-powered Trade Score and insights\n• Psychology tracker for emotional patterns\n• Session & symbol analytics\n• Weekly review reports\n\nAll it takes is connecting your MT5 account or logging a single trade manually.",
        ctaText: "Start Now →",
        ctaHref: "/dashboard/accounts?setup=sync",
    },
};
