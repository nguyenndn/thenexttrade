export interface AnalyticsData {
    period: string;
    summary: {
        pageviews: number;
        uniqueVisitors: number;
        realTimeVisitors: number;
        avgPagesPerVisitor: number;
    };
    trend: Array<{ date: string; views: number }>;
    topCountries: Array<{ country: string; views: number }>;
    topPages: Array<{ pathname: string; views: number }>;
    topReferrers: Array<{ referrer: string; views: number }>;
    devices: Array<{ device: string; count: number }>;
    browsers: Array<{ browser: string; count: number }>;
}

export interface EventsData {
    period: string;
    events: Array<{ name: string; count: number }>;
    recentEvents: Array<{
        id: string;
        name: string;
        data: Record<string, string> | null;
        pathname: string | null;
        country: string | null;
        createdAt: string;
    }>;
    funnel: {
        visitors: number;
        interested: number;
        signedUp: number;
        activated: number;
    };
}

export const COUNTRY_NAMES: Record<string, string> = {
    US: 'United States', GB: 'United Kingdom', VN: 'Vietnam',
    DE: 'Germany', FR: 'France', JP: 'Japan', KR: 'South Korea',
    SG: 'Singapore', AU: 'Australia', CA: 'Canada', IN: 'India',
    TH: 'Thailand', MY: 'Malaysia', ID: 'Indonesia', PH: 'Philippines',
    BR: 'Brazil', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
    SE: 'Sweden', CH: 'Switzerland', PL: 'Poland', RU: 'Russia',
    AE: 'UAE', NG: 'Nigeria', ZA: 'South Africa', MX: 'Mexico',
    TR: 'Turkey', EG: 'Egypt', SA: 'Saudi Arabia', CN: 'China',
    HK: 'Hong Kong', TW: 'Taiwan', NZ: 'New Zealand',
};

export const COUNTRY_FLAGS: Record<string, string> = {
    US: '🇺🇸', GB: '🇬🇧', VN: '🇻🇳', DE: '🇩🇪', FR: '🇫🇷',
    JP: '🇯🇵', KR: '🇰🇷', SG: '🇸🇬', AU: '🇦🇺', CA: '🇨🇦',
    IN: '🇮🇳', TH: '🇹🇭', MY: '🇲🇾', ID: '🇮🇩', PH: '🇵🇭',
    BR: '🇧🇷', IT: '🇮🇹', ES: '🇪🇸', NL: '🇳🇱', SE: '🇸🇪',
    CH: '🇨🇭', PL: '🇵🇱', RU: '🇷🇺', AE: '🇦🇪', NG: '🇳🇬',
    ZA: '🇿🇦', MX: '🇲🇽', TR: '🇹🇷', EG: '🇪🇬', SA: '🇸🇦',
    CN: '🇨🇳', HK: '🇭🇰', TW: '🇹🇼', NZ: '🇳🇿',
};

export const EVENT_LABELS: Record<string, string> = {
    click_open_account: 'Open Account',
    click_download_ea: 'EA Download',
    signup_complete: 'Sign Up',
    complete_lesson: 'Lesson Complete',
    first_trade_sync: 'First Trade Sync',
    journal_entry_created: 'Journal Entry',
};

export const PIE_COLORS = ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
