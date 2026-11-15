export type ShowcaseTabType = "psych" | "mindset" | "tips";

export interface TabPost {
    title: string;
    body: string;
    footerLeft: string;
    footerRight: string;
}

export interface ShowcaseIndices {
    psych: number;
    mindset: number;
    tips: number;
}
