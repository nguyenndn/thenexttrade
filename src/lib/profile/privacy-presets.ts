export type PublicPrivacyPreset =
    "PRIVATE" | "SAFE_PUBLIC" | "PERFORMANCE_ONLY" | "FULL_PUBLIC";

export interface ProfilePrivacyFields {
    isPublicProfile: boolean;
    showMoney: boolean;
    showBroker: boolean;
    showAccountNumber: boolean;
    showRealName: boolean;
    showPercentMetrics: boolean;
    showTradeScore: boolean;
    showBadges: boolean;
    showPairStats: boolean;
    showSessionStats: boolean;
    showTradingStyle: boolean;
}

export function applyPrivacyPreset(
    preset: PublicPrivacyPreset
): Partial<ProfilePrivacyFields> {
    switch (preset) {
        case "PRIVATE":
            return {
                isPublicProfile: false,
            };
        case "SAFE_PUBLIC":
            return {
                isPublicProfile: true,
                showRealName: false,
                showMoney: false,
                showBroker: false,
                showAccountNumber: false,
                showPercentMetrics: true,
                showTradeScore: true,
                showBadges: true,
                showPairStats: true,
                showSessionStats: true,
                showTradingStyle: true,
            };
        case "PERFORMANCE_ONLY":
            return {
                isPublicProfile: true,
                showRealName: false,
                showMoney: false,
                showBroker: false,
                showAccountNumber: false,
                showPercentMetrics: true,
                showTradeScore: true,
                showBadges: false,
                showPairStats: true,
                showSessionStats: false,
                showTradingStyle: false,
            };
        case "FULL_PUBLIC":
            return {
                isPublicProfile: true,
                showRealName: true,
                showMoney: true,
                showBroker: true,
                showAccountNumber: true,
                showPercentMetrics: true,
                showTradeScore: true,
                showBadges: true,
                showPairStats: true,
                showSessionStats: true,
                showTradingStyle: true,
            };
        default:
            return {};
    }
}

export function sanitizePublicProfileData(profile: any) {
    if (!profile) return null;
    const sanitized = JSON.parse(JSON.stringify(profile));

    if (!sanitized.isPublicProfile) {
        return null;
    }

    if (!sanitized.showRealName) {
        sanitized.realName = null;
        if (sanitized.user) {
            sanitized.user.name = null;
        }
    }

    if (!sanitized.showMoney) {
        if (sanitized.mainTradingAccount) {
            sanitized.mainTradingAccount.balance = 0;
            sanitized.mainTradingAccount.equity = 0;
        }
    }

    if (!sanitized.showBroker) {
        if (sanitized.mainTradingAccount) {
            sanitized.mainTradingAccount.broker = null;
            sanitized.mainTradingAccount.server = null;
        }
    }

    if (!sanitized.showAccountNumber) {
        if (sanitized.mainTradingAccount) {
            sanitized.mainTradingAccount.accountNumber = null;
        }
    }

    return sanitized;
}

export function canExposeSensitiveProfileField(
    profile: any,
    field: string
): boolean {
    if (!profile) return false;
    switch (field) {
        case "realName":
            return !!profile.showRealName;
        case "money":
            return !!profile.showMoney;
        case "broker":
            return !!profile.showBroker;
        case "accountNumber":
            return !!profile.showAccountNumber;
        default:
            return false;
    }
}
