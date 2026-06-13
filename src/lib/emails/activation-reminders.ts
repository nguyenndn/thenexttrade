/**
 * Email templates builder for onboarding activation reminders
 */
import { buildUnifiedEmailHtml } from "../services/email.service";

export type ActivationReminderType =
 | "NO_ACCOUNT_24H"
 | "NO_FIRST_DATA_24H"
 | "STILL_NO_FIRST_VALUE_72H"
 | "MOBILE_SYNC_FALLBACK";

/**
 * Returns subject line based on reminder type
 */
export function buildActivationEmailSubject(type: ActivationReminderType): string {
 switch (type) {
 case "NO_ACCOUNT_24H":
 return "Complete your TheNextTrade setup 🚀";
 case "NO_FIRST_DATA_24H":
 return "Dashboard is waiting: Sync your first trade 📊";
 case "STILL_NO_FIRST_VALUE_72H":
 return "Unlock your AI Trading Dashboard today ✨";
 case "MOBILE_SYNC_FALLBACK":
 return "Finish your MT5 Auto-Sync setup on desktop 💻";
 }
}

/**
 * Builds HTML template for transactional emails
 */
export function buildActivationEmailHtml(
 type: ActivationReminderType,
 name: string | null,
 preferredSyncMethod: "TNT_CONNECT" | "EA_SYNC" | "MANUAL",
 link: string
): string {
 const userName = name || "Trader";
 const appUrl = link.split("/dashboard")[0];
 const btnStyles = `
 display: inline-block;
 padding: 12px 28px;
 background-color: #00C888;
 color: #ffffff !important;
 text-decoration: none;
 font-weight: bold;
 border-radius: 8px;
 margin: 20px 0;
 `;

 let bodyHtml = "";

 if (type === "NO_ACCOUNT_24H") {
 bodyHtml = `
 <p>Hi ${userName},</p>
 <p>Your trading command center is ready, but you haven't connected a trading account yet.</p>
 <p>Connecting your account takes less than 60 seconds and allows you to track and analyze your trades in real-time.</p>
 <p style="text-align: center; margin: 24px 0;">
 <a href="${link}" style="${btnStyles}">Connect Your Account</a>
 </p>
 <p>Once connected, you will unlock performance charts, AI insights, and streak rewards automatically.</p>
 `;
 } else if (type === "NO_FIRST_DATA_24H") {
 const methodDesc = preferredSyncMethod === "MANUAL"
 ? "log your first trade manually"
 : "sync your first trade automatically from MetaTrader";

 bodyHtml = `
 <p>Hi ${userName},</p>
 <p>Your account is successfully connected! The next step is to ${methodDesc} to unlock the full power of your dashboard.</p>
 <p>Once your first trade is logged, we will analyze your metrics and generate your first AI performance score.</p>
 <p style="text-align: center; margin: 24px 0;">
 <a href="${link}" style="${btnStyles}">Sync/Log Your First Trade</a>
 </p>
 `;
 } else if (type === "STILL_NO_FIRST_VALUE_72H") {
 bodyHtml = `
 <p>Hi ${userName},</p>
 <p>It's been a few days since you joined, and you are missing out on the core features of TheNextTrade:</p>
 <ul style="padding-left: 20px; margin: 16px 0; color: #475569;">
 <li style="margin-bottom: 8px;"><strong>AI Trade Score</strong>: Professional feedback on every trade.</li>
 <li style="margin-bottom: 8px;"><strong>Psychology Tracker</strong>: Identify mental errors costing you money.</li>
 <li style="margin-bottom: 8px;"><strong>Weekly Performance Reviews</strong>: Direct, actionable feedback every weekend.</li>
 </ul>
 <p>Connect your account or log a trade now to take control of your trading metrics.</p>
 <p style="text-align: center; margin: 24px 0;">
 <a href="${link}" style="${btnStyles}">Get Started Now</a>
 </p>
 `;
 } else if (type === "MOBILE_SYNC_FALLBACK") {
 const setupName = preferredSyncMethod === "EA_SYNC" ? "EA Sync" : "TNT Connect";
 bodyHtml = `
 <p>Hi ${userName},</p>
 <p>You recently tried to set up <strong>${setupName}</strong> from a mobile device.</p>
 <p>Because MetaTrader 5 auto-syncing requires installing our local helper app, setup must be completed on a <strong>Windows Desktop or VPS</strong>.</p>
 <p>Open this setup link on your desktop browser to finish the installation:</p>
 <p style="text-align: center; margin: 24px 0;">
 <a href="${link}" style="${btnStyles}">Finish Desktop Setup</a>
 </p>
 <p style="margin-top: 16px;">Alternatively, you can always log trades manually on your mobile phone via your Journal hub.</p>
 `;
 }

 return buildUnifiedEmailHtml({
 subject: buildActivationEmailSubject(type),
 bodyHtml,
 appUrl
 });
}

/**
 * Builds plain text version for email fallback
 */
export function buildActivationEmailText(
 type: ActivationReminderType,
 name: string | null,
 preferredSyncMethod: "TNT_CONNECT" | "EA_SYNC" | "MANUAL",
 link: string
): string {
 const userName = name || "Trader";

 if (type === "NO_ACCOUNT_24H") {
 return `
Hi ${userName},

Your trading command center is ready, but you haven't connected a trading account yet.
Connecting your account takes less than 60 seconds and allows you to track and analyze your trades in real-time.

Connect Your Account: ${link}

Once connected, you will unlock performance charts, AI insights, and streak rewards automatically.
 `;
 } else if (type === "NO_FIRST_DATA_24H") {
 const methodDesc = preferredSyncMethod === "MANUAL"
 ? "log your first trade manually"
 : "sync your first trade automatically from MetaTrader";

 return `
Hi ${userName},

Your account is successfully connected! The next step is to ${methodDesc} to unlock the full power of your dashboard.

Sync/Log Your First Trade: ${link}
 `;
 } else if (type === "STILL_NO_FIRST_VALUE_72H") {
 return `
Hi ${userName},

It's been a few days since you joined, and you are missing out on the core features of TheNextTrade:
- AI Trade Score
- Psychology Tracker
- Weekly Performance Reviews

Get Started Now: ${link}
 `;
 } else if (type === "MOBILE_SYNC_FALLBACK") {
 const setupName = preferredSyncMethod === "EA_SYNC" ? "EA Sync" : "TNT Connect";
 return `
Hi ${userName},

You recently tried to set up ${setupName} from a mobile device.
Because MetaTrader 5 auto-syncing requires installing our local helper app, setup must be completed on a Windows Desktop or VPS.

Finish Desktop Setup: ${link}

Alternatively, you can always log trades manually on your mobile phone via your Journal hub.
 `;
 }

 return "";
}
