namespace Mt5Bridge;

public record ConnectRequest(
    ulong Login,
    string Password,
    string Server,
    string? AccountId = null,
    string? UserId = null,
    string? UserName = null,
    string? UserEmail = null,
    bool IsUnderIb = false,
    string? AccessExpiresAt = null
);

public record DisconnectRequest(
    ulong Login
);

public record ExecuteCommandRequest(
    ulong Login,
    string Action,
    long? Ticket = null,
    string? Symbol = null,
    double? Value = null
);

public record ManageRuleRequest(
    ulong Login,
    string Operation, // "ADD" | "REMOVE" | "CLEAR" | "SET_DAILY"
    string? RuleId = null,
    string? Type = null, // "PRICE_BE" | "PRICE_CLOSE" | "DAILY_LOSS_LIMIT" | "DAILY_PROFIT_TARGET"
    string? Symbol = null,
    double? TargetPrice = null,
    double? PercentValue = null,
    string? Direction = null // "ABOVE" | "BELOW"
);

public record ArmedRuleDto(
    string Id,
    string Type,
    string Symbol,
    double? TargetPrice,
    double? PercentValue,
    string Direction,
    string Label,
    string Status,
    DateTime CreatedAt,
    DateTime? TriggeredAt = null
);

public record ActivityItemDto(
    string Id,
    string Action,
    string Title,
    string Detail,
    string Source, // "MOBILE" | "RULE_24_5" | "SYSTEM"
    string Status, // "DONE" | "PARTIAL" | "ERROR"
    DateTime Timestamp
);

public record PositionDto(
    long Ticket,
    string Symbol,
    string Type, // "BUY" | "SELL"
    double Lots,
    double OpenPrice,
    double CurrentPrice,
    double StopLoss,
    double TakeProfit,
    double Profit,
    double Swap,
    double Commission,
    double NetProfit,
    double Pips,
    DateTime OpenTime,
    string Comment
);

public record PendingOrderDto(
    long Ticket,
    string Symbol,
    string Type,
    double Lots,
    double OpenPrice,
    double StopLoss,
    double TakeProfit,
    DateTime OpenTime,
    string Comment
);

public record QuoteDto(
    string Symbol,
    double Bid,
    double Ask,
    double SpreadPips,
    DateTime Time
);

public record CandleDto(
    long Time, // Unix seconds (for lightweight-charts)
    double Open,
    double High,
    double Low,
    double Close
);

public record SymbolSummaryDto(
    string Symbol,
    int OpenCount,
    double BuyLots,
    double SellLots,
    double TotalLots,
    double FloatingPnl,
    double Bid,
    double Ask
);

public record AccountStateDto(
    ulong Login,
    string Server,
    string CompanyName,
    string AccountName,
    string Currency,
    int Leverage,
    bool IsInvestor,
    bool IsDemo,
    bool Connected,
    string Status,
    int LatencyMs,
    string Datacenter,
    double Balance,
    double Credit,
    double Equity,
    double FloatingPnl,
    double FloatingPnlPercent,
    double Margin,
    double FreeMargin,
    double MarginLevel,
    int OpenCount,
    double TotalLots,
    double DailyLossLimitPercent,
    double DailyProfitTargetPercent,
    List<PositionDto> OpenPositions,
    List<PendingOrderDto> PendingOrders,
    List<SymbolSummaryDto> SymbolSummaries,
    List<ArmedRuleDto> ArmedRules,
    List<ActivityItemDto> RecentActivity,
    QuoteDto? ActiveQuote,
    List<CandleDto> Candles,
    DateTime LastUpdateUtc,
    string? ErrorMessage = null
);

public record ExecuteResultDto(
    bool Success,
    string Action,
    int MovedOrClosed,
    int Skipped,
    string Message,
    ActivityItemDto Activity,
    AccountStateDto? State = null
);

public record AdminConnectionDto(
    ulong Login,
    string Server,
    string CompanyName,
    string AccountName,
    string Currency,
    bool IsDemo,
    bool IsInvestor,
    bool Connected,
    string Status,
    int LatencyMs,
    string Datacenter,
    double Balance,
    double Equity,
    double FloatingPnl,
    double FloatingPnlPercent,
    double MarginLevel,
    double FreeMargin,
    int OpenPositionsCount,
    double TotalLots,
    int ArmedRulesCount,
    List<ArmedRuleDto> ArmedRules,
    List<ActivityItemDto> RecentActivity,
    string? AccountId,
    string? UserId,
    string? UserName,
    string? UserEmail,
    bool IsUnderIb,
    string? AccessExpiresAt,
    DateTime ConnectedAtUtc,
    DateTime LastQuoteUtc,
    string? ErrorMessage
);

public record BridgeHealthDto(
    string Status,
    long UptimeSeconds,
    double MemoryMb,
    int ConnectedAccounts,
    int TotalAccounts,
    int ArmedRulesCount,
    double TotalLiveEquity,
    double TotalFloatingPnl,
    string Version,
    int Mt5Build,
    DateTime TimestampUtc
);
