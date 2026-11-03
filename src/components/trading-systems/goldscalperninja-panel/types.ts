export type TradeDirection =
    | "ONLY BUY"
    | "ONLY SELL"
    | "BUY & SELL"
    | "AUTO TREND";

export interface AccountTelemetry {
    balance: number;
    equity: number;
    todayPL: number;
    drawdown: number;
}

export interface BasketPosition {
    orders: number;
    lots: number;
    profit: number;
}

export interface PanelState {
    direction: TradeDirection;
    cycleRunning: boolean;
    newsStatus: "OK" | "PAUSED" | "OFF";
    dailyStatus: "OK" | "TARGET" | "STOP";
    licenseStatus: string;
    accountId: string;
    account: AccountTelemetry;
    buy: BasketPosition;
    sell: BasketPosition;
    actionFeedback: string | null;
}

export const INITIAL_ACCOUNT: AccountTelemetry = {
    balance: 117810.69,
    equity: 117810.69,
    todayPL: 0.0,
    drawdown: 0.0,
};

export const INITIAL_BUY: BasketPosition = {
    orders: 0,
    lots: 0.0,
    profit: 0.0,
};

export const INITIAL_SELL: BasketPosition = {
    orders: 0,
    lots: 0.0,
    profit: 0.0,
};
