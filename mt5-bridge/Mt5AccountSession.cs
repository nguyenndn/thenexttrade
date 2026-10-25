using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text.Json;
using mtapi.mt5;

namespace Mt5Bridge;

public class Mt5AccountSession : IDisposable
{
    private readonly ServerResolver _resolver;
    private readonly object _syncLock = new();

    public ulong Login { get; }
    public string Password { get; private set; }
    public string Server { get; private set; }
    public string? AccountId { get; set; }
    public string? UserId { get; set; }
    public string? UserName { get; set; }
    public string? UserEmail { get; set; }
    public bool IsUnderIb { get; set; }
    public string? AccessExpiresAt { get; set; }

    public bool IsSimulation =>
        Login == 99999999 ||
        Server.Equals("TheNextTrade-Sim", StringComparison.OrdinalIgnoreCase);

    private static readonly int IdleSleepSeconds = ResolveIdleSleepSeconds();

    private static int ResolveIdleSleepSeconds()
    {
        var raw = Environment.GetEnvironmentVariable("MT5_WORKER_IDLE_SLEEP_SECONDS");
        if (int.TryParse(raw, out var seconds) && seconds >= 10)
        {
            return seconds;
        }
        return 180; // Default: 3 minutes (180s)
    }

    private MT5API? _api;
    private readonly Mt5WorkerClient _worker;
    private readonly object _wakeLock = new();
    private Task<bool>? _wakeTask;
    private DateTime _lastWakeAttemptUtc = DateTime.MinValue;
    private volatile bool _isSleeping;
    private volatile bool _isWaking;
    private volatile bool _isDisconnected;
    private string _desiredSymbol = "XAUUSD";
    private int _desiredTimeframe = 15;
    private bool _useTerminalIpc;
    private Mt5WorkerState? _lastWorkerState;
    private DateTime _lastIpcFetchUtc = DateTime.MinValue;
    private string _connectedHost = "";
    private int _connectedPort = 443;
    public int LatencyMs { get; private set; } = 12;
    public string Datacenter { get; private set; } = "London";
    public string Status { get; private set; } = "DISCONNECTED";
    public string? ErrorMessage { get; private set; }
    public DateTime ConnectedAtUtc { get; private set; } = DateTime.UtcNow;
    public DateTime LastQuoteUtc { get; private set; } = DateTime.UtcNow;
    public DateTime LastClientAccessUtc { get; private set; } = DateTime.UtcNow;
    public DateTime? SleepingSinceUtc { get; private set; }

    public bool IsSleeping => _isSleeping;
    public bool IsWaking => _isWaking;

    public bool HasArmedRules
    {
        get
        {
            lock (_syncLock)
            {
                return _armedRules.Any(r => r.Status == "ARMED") ||
                       DailyLossLimitPercent < 0 ||
                       DailyProfitTargetPercent > 0;
            }
        }
    }

    public int LastKnownOpenPositionsCount =>
        _lastWorkerState?.Positions?.Count ?? 0;

    public bool Requires24x5RuleGuard =>
        HasArmedRules && LastKnownOpenPositionsCount > 0;

    public double DailyLossLimitPercent { get; set; }
    public double DailyProfitTargetPercent { get; set; }

    private readonly ConcurrentDictionary<string, QuoteDto> _latestQuotes =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly ConcurrentDictionary<string, (DateTime FetchedAt, List<CandleDto> Candles)> _candleCache =
        new(StringComparer.OrdinalIgnoreCase);
    private readonly List<ArmedRuleDto> _armedRules = new();
    private readonly List<ActivityItemDto> _activities = new();

    // Simulation state (only used when IsSimulation == true)
    private double _simBalance = 351418.03;
    private readonly List<PositionDto> _simPositions = new();
    private readonly List<PendingOrderDto> _simPending = new();
    private double _simBid = 4135.40;
    private double _simAsk = 4135.64;

    public Mt5AccountSession(
        ConnectRequest req,
        ServerResolver resolver)
    {
        _resolver = resolver;
        Login = req.Login;
        _worker = new Mt5WorkerClient(req.Login);
        Password = req.Password;
        Server = req.Server.Trim();
        AccountId = req.AccountId;
        UserId = req.UserId;
        UserName = req.UserName;
        UserEmail = req.UserEmail;
        IsUnderIb = req.IsUnderIb;
        AccessExpiresAt = req.AccessExpiresAt;
        LastClientAccessUtc = DateTime.UtcNow;
    }

    public void TouchClientAccess(string? requestedSymbol = null, int timeframeMinutes = 0)
    {
        LastClientAccessUtc = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(requestedSymbol))
        {
            _desiredSymbol = requestedSymbol.Trim().ToUpperInvariant();
        }
        if (timeframeMinutes > 0)
        {
            _desiredTimeframe = timeframeMinutes;
        }
    }

    public void UpdateMetadata(ConnectRequest req)
    {
        Password = req.Password;
        Server = req.Server.Trim();
        if (!string.IsNullOrWhiteSpace(req.AccountId)) AccountId = req.AccountId;
        if (!string.IsNullOrWhiteSpace(req.UserId)) UserId = req.UserId;
        if (!string.IsNullOrWhiteSpace(req.UserName)) UserName = req.UserName;
        if (!string.IsNullOrWhiteSpace(req.UserEmail)) UserEmail = req.UserEmail;
        IsUnderIb = req.IsUnderIb;
        if (!string.IsNullOrWhiteSpace(req.AccessExpiresAt)) AccessExpiresAt = req.AccessExpiresAt;
        LastClientAccessUtc = DateTime.UtcNow;
    }

    public bool Connected => IsSimulation
        ? Status == "LIVE"
        : (_useTerminalIpc
            ? (Status == "LIVE" || Status == "IDLE_SLEEP" || Status == "WAKING")
            : (_api?.Connected ?? false));

    public void Connect()
    {
        _isDisconnected = false;
        LastClientAccessUtc = DateTime.UtcNow;
        if (IsSimulation)
        {
            InitSimulationState();
            Status = "LIVE";
            ErrorMessage = null;
            ConnectedAtUtc = DateTime.UtcNow;
            LastQuoteUtc = DateTime.UtcNow;
            LatencyMs = 9;
            Datacenter = "London";
            AddActivity("CONNECT", $"Connected to {Server} (••{Login % 10000:D4})", $"Direct Cloud Bridge • {Datacenter} • {LatencyMs} ms", "SYSTEM", "DONE");
            return;
        }

        // 1. Primary: Connect via isolated C# + MQL5 background portable worker (.mt5-workers/{login}/terminal64.exe on hidden desktop)
        // Completely independent of user's main MT5 UI (C:\Program Files\MetaTrader 5\terminal64.exe) and other worker instances.
        if (TryConnectViaWorker(out var workerAuthErr, out var workerOtherErr))
        {
            return;
        }
        if (!string.IsNullOrEmpty(workerAuthErr))
        {
            Status = "AUTH_FAILED";
            ErrorMessage = workerAuthErr;
            throw new UnauthorizedAccessException(ErrorMessage);
        }

        var endpoints = _resolver.Resolve(Server);
        if (endpoints.Count == 0)
        {
            Status = "SERVER_NOT_FOUND";
            ErrorMessage = $"Could not resolve MT5 server '{Server}'. Please check the server name or enter host:port.";
            throw new InvalidOperationException(ErrorMessage);
        }

        Exception? lastEx = null;
        string? authErrorCode = null;
        var attemptLogs = new List<string>();
        var candidateBuilds = new[] { 4150, 4850, 5830 };

        foreach (var ep in endpoints.Take(4))
        {
            foreach (var build in candidateBuilds)
            {
                MT5API? candidate = null;
                try
                {
                    var sw = Stopwatch.StartNew();
                    candidate = new MT5API(Login, Password, ep.Host, ep.Port)
                    {
                        Build = build,
                        ConnectTimeout = 8000,
                        EnableAllOrderUpdates = true
                    };
                    Mt5DirectConnector.ConnectDirect(candidate, 9000);
                    sw.Stop();

                    // Successfully connected!
                    DisposeApi();
                    _api = candidate;
                    _connectedHost = ep.Host;
                    _connectedPort = ep.Port;
                    ConnectedAtUtc = DateTime.UtcNow;
                    LastQuoteUtc = DateTime.UtcNow;
                    Status = "LIVE";
                    ErrorMessage = null;

                    int ping = 0;
                    try { ping = MT5API.PingHost(ep.Host, ep.Port); } catch { /* ignore */ }
                    LatencyMs = ping is > 0 and < 1500 ? ping : (int)Math.Clamp(sw.ElapsedMilliseconds / 6, 8, 95);
                    Datacenter = InferDatacenter(ep.Host, Server);

                    _api.OnQuote += OnApiQuote;
                    _api.OnOrderUpdate += OnApiOrderUpdate;

                    SubscribeInitialSymbols();
                    AddActivity("CONNECT", $"Connected to {Server} (••{Login % 10000:D4})", $"Direct MT5 TCP Socket • {Datacenter} • {LatencyMs} ms", "SYSTEM", "DONE");
                    return;
                }
                catch (ServerException sx)
                {
                    try { candidate?.Disconnect(); } catch { /* ignore */ }

                    var codeStr = sx.Code.ToString();
                    attemptLogs.Add($"{ep.Host}:{ep.Port} -> {codeStr}");

                    if (codeStr.Contains("OLD_VERSION", StringComparison.OrdinalIgnoreCase))
                    {
                        lastEx = sx;
                        continue; // Try higher build on same endpoint
                    }

                    if (codeStr.Contains("INVALID_ACCOUNT", StringComparison.OrdinalIgnoreCase) ||
                        codeStr.Contains("INVALID_PASSWORD", StringComparison.OrdinalIgnoreCase) ||
                        codeStr.Contains("ACCOUNT_DISABLED", StringComparison.OrdinalIgnoreCase) ||
                        codeStr.Contains("AUTHORIZATION", StringComparison.OrdinalIgnoreCase))
                    {
                        authErrorCode = codeStr;
                        lastEx = sx;
                        break; // Try next endpoint in cluster before failing
                    }

                    lastEx = sx;
                    break; // Try next endpoint
                }
                catch (Exception ex)
                {
                    try { candidate?.Disconnect(); } catch { /* ignore */ }
                    attemptLogs.Add($"{ep.Host}:{ep.Port}(b={build}) -> {ex.Message}");
                    lastEx = ex;
                    if (attemptLogs.Count < candidateBuilds.Length)
                    {
                        continue; // Try all candidate builds on primary endpoint
                    }
                    break; // Try next endpoint
                }
            }
        }

        var detailTrace = attemptLogs.Count > 0 ? $" [{string.Join(" | ", attemptLogs)}]" : "";
        if (!string.IsNullOrEmpty(authErrorCode))
        {
            Status = "AUTH_FAILED";
            ErrorMessage = $"MT5 authentication failed ({authErrorCode}) for #{Login} on {Server}.{detailTrace}";
            throw new UnauthorizedAccessException(ErrorMessage, lastEx);
        }

        Status = "CONNECTION_FAILED";
        ErrorMessage = lastEx != null
            ? $"Unable to connect #{Login} to {Server}: {lastEx.Message}{detailTrace}"
            : $"Unable to connect #{Login} to {Server}.{detailTrace}";
        throw new InvalidOperationException(ErrorMessage, lastEx);
    }

    private void SubscribeInitialSymbols()
    {
        if (_api == null || !_api.Connected) return;
        var symbols = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "XAUUSD", "EURUSD" };
        try
        {
            var orders = _api.GetOpenedOrders(OrderSort.OpenTime, false);
            if (orders != null)
            {
                foreach (var o in orders)
                {
                    if (!string.IsNullOrWhiteSpace(o?.Symbol))
                        symbols.Add(o.Symbol);
                }
            }
        }
        catch { /* ignore */ }

        foreach (var sym in symbols)
        {
            try
            {
                _api.Subscribe(sym);
                var q = _api.GetQuote(sym, 1000, 60000);
                if (q != null)
                {
                    UpdateQuoteCache(q);
                }
            }
            catch { /* symbol might have suffix on this broker */ }
        }
    }

    private void OnApiQuote(MT5API sender, Quote quote)
    {
        if (quote == null || string.IsNullOrWhiteSpace(quote.Symbol)) return;
        LastQuoteUtc = DateTime.UtcNow;
        try { sender.UpdateProfits(quote); } catch { /* ignore */ }
        UpdateQuoteCache(quote);
        EvaluateArmedRules(quote.Symbol, quote.Bid, quote.Ask);
    }

    private void OnApiOrderUpdate(MT5API sender, OrderUpdate update)
    {
        LastQuoteUtc = DateTime.UtcNow;
        try
        {
            if (update?.Order != null && !string.IsNullOrWhiteSpace(update.Order.Symbol))
            {
                if (!sender.IsSubscribed(update.Order.Symbol))
                    sender.Subscribe(update.Order.Symbol);
            }
        }
        catch { /* ignore */ }
    }

    private void UpdateQuoteCache(Quote q)
    {
        var pipSize = GetPipSize(q.Symbol);
        var spreadPips = pipSize > 0 ? Math.Round((q.Ask - q.Bid) / pipSize, 1) : 0;
        _latestQuotes[q.Symbol] = new QuoteDto(
            q.Symbol,
            q.Bid,
            q.Ask,
            spreadPips,
            q.Time == default ? DateTime.UtcNow : q.Time
        );
    }

    public static bool SymbolsMatch(string? a, string? b)
    {
        if (string.IsNullOrWhiteSpace(a) || string.IsNullOrWhiteSpace(b))
            return false;
        var sa = a.Trim();
        var sb = b.Trim();
        return string.Equals(sa, sb, StringComparison.OrdinalIgnoreCase) ||
               sa.StartsWith(sb, StringComparison.OrdinalIgnoreCase) ||
               sb.StartsWith(sa, StringComparison.OrdinalIgnoreCase);
    }

    private bool ShouldIdleSleep()
    {
        if (IsSimulation || !_useTerminalIpc || _isDisconnected)
            return false;

        if (Requires24x5RuleGuard)
            return false;

        return (DateTime.UtcNow - LastClientAccessUtc).TotalSeconds >= IdleSleepSeconds;
    }

    private void EnterIdleSleep()
    {
        lock (_wakeLock)
        {
            if (_isSleeping || _isWaking || _isDisconnected || !ShouldIdleSleep())
                return;

            if (_wakeTask != null && !_wakeTask.IsCompleted)
                return;

            var finalState = _worker.TryReadFreshState(maxAgeMs: 10000);
            if (finalState != null && finalState.Connected && finalState.Authorized)
            {
                _lastWorkerState = finalState;
                _lastIpcFetchUtc = DateTime.UtcNow;
                CacheQuotesFromWorker(finalState);
            }

            // Re-check ShouldIdleSleep() in case client activity arrived or open positions were discovered while reading state
            if (_isDisconnected || !ShouldIdleSleep())
                return;

            _isSleeping = true;
            _isWaking = false;
            SleepingSinceUtc = DateTime.UtcNow;
            Status = "IDLE_SLEEP";
            ErrorMessage = null;
            _worker.StopWorkerProcessOnly();
        }
    }

    public void EnsureWorkerAwakeAsync()
    {
        if (IsSimulation || !_useTerminalIpc || _isDisconnected)
            return;

        lock (_wakeLock)
        {
            if (_isDisconnected)
                return;

            if (_wakeTask != null && !_wakeTask.IsCompleted)
                return;

            if (!_isSleeping && !_isWaking && _worker.IsRunning)
                return;

            _isWaking = true;
            _isSleeping = false;
            Status = "WAKING";
            ErrorMessage = null;
            _lastWakeAttemptUtc = DateTime.UtcNow;
            _wakeTask = Task.Run(() => WakeWorkerCore(timeoutMs: 14000));
        }
    }

    public bool EnsureWorkerAwakeBlocking(int timeoutMs = 14000)
    {
        if (IsSimulation || !_useTerminalIpc)
            return true;

        if (_isDisconnected)
            return false;

        if (!_isSleeping && !_isWaking && _worker.IsRunning)
            return true;

        Task<bool>? taskToWait;
        lock (_wakeLock)
        {
            if (_isDisconnected)
                return false;

            if (!_isSleeping && !_isWaking && _worker.IsRunning)
                return true;

            if (_wakeTask == null || _wakeTask.IsCompleted)
            {
                _isWaking = true;
                _isSleeping = false;
                Status = "WAKING";
                ErrorMessage = null;
                _lastWakeAttemptUtc = DateTime.UtcNow;
                _wakeTask = Task.Run(() => WakeWorkerCore(timeoutMs));
            }
            taskToWait = _wakeTask;
        }

        try
        {
            taskToWait.Wait(timeoutMs);
        }
        catch
        {
            // Handled inside WakeWorkerCore
        }

        return !_isDisconnected && !_isSleeping && _worker.IsRunning;
    }

    private bool WakeWorkerCore(int timeoutMs)
    {
        try
        {
            if (_isDisconnected || !_useTerminalIpc)
                return false;

            var sw = Stopwatch.StartNew();
            var endpoints = _resolver.Resolve(Server);
            string? fallbackHostPort = endpoints.Count > 0 ? $"{endpoints[0].Host}:{endpoints[0].Port}" : null;
            var targetSym = !string.IsNullOrWhiteSpace(_desiredSymbol) ? _desiredSymbol : "XAUUSD";
            var targetTf = _desiredTimeframe > 0 ? _desiredTimeframe : 15;

            var state = _worker.Connect(
                Login,
                Password,
                Server,
                fallbackHostPort,
                timeoutMs: timeoutMs,
                startSymbol: targetSym,
                startTimeframeMinutes: targetTf);
            sw.Stop();

            if (_isDisconnected || !_useTerminalIpc)
            {
                _worker.StopWorkerProcessOnly();
                _isSleeping = false;
                _isWaking = false;
                Status = "DISCONNECTED";
                return false;
            }

            bool symbolChanged = !string.IsNullOrEmpty(targetSym) &&
                                 !SymbolsMatch(state.ActiveSymbol, targetSym);
            bool tfChanged = targetTf > 0 && state.ActiveTimeframe != targetTf;
            if (symbolChanged || tfChanged)
            {
                _worker.SendCommand("SET_CHART", ticket: targetTf, symbol: targetSym, timeoutMs: 2500);
                state = _worker.TryReadFreshState(maxAgeMs: 5000) ?? state;
            }

            _lastWorkerState = state;
            _lastIpcFetchUtc = DateTime.UtcNow;
            LastQuoteUtc = DateTime.UtcNow;
            SleepingSinceUtc = null;
            _isSleeping = false;
            _isWaking = false;
            Status = "LIVE";
            ErrorMessage = null;
            LatencyMs = (int)Math.Clamp(sw.ElapsedMilliseconds / 20, 8, 65);
            CacheQuotesFromWorker(state);
            return true;
        }
        catch (UnauthorizedAccessException uex)
        {
            _isSleeping = false;
            _isWaking = false;
            if (_isDisconnected)
            {
                Status = "DISCONNECTED";
                return false;
            }
            Status = "AUTH_FAILED";
            ErrorMessage = uex.Message;
            return false;
        }
        catch (Exception ex)
        {
            _isWaking = false;
            if (_isDisconnected || !_useTerminalIpc)
            {
                _isSleeping = false;
                Status = "DISCONNECTED";
                return false;
            }
            if (_lastWorkerState != null)
            {
                _isSleeping = true;
                Status = "IDLE_SLEEP";
                ErrorMessage = null;
            }
            else
            {
                Status = "CONNECTION_FAILED";
                ErrorMessage = ex.Message;
            }
            return false;
        }
    }

    public void TickSimulationAndWatchdog()
    {
        if (IsSimulation && Status == "LIVE")
        {
            lock (_syncLock)
            {
                var step = (Random.Shared.NextDouble() - 0.48) * 0.65;
                _simBid = Math.Round(Math.Max(2000, _simBid + step), 2);
                _simAsk = Math.Round(_simBid + 0.24, 2);
                LastQuoteUtc = DateTime.UtcNow;
                _latestQuotes["XAUUSD"] = new QuoteDto("XAUUSD", _simBid, _simAsk, 2.4, DateTime.UtcNow);

                for (int i = 0; i < _simPositions.Count; i++)
                {
                    var p = _simPositions[i];
                    var cur = p.Type == "BUY" ? _simBid : _simAsk;
                    var diff = p.Type == "BUY" ? (cur - p.OpenPrice) : (p.OpenPrice - cur);
                    var pips = Math.Round(diff / 0.10, 1);
                    var profit = Math.Round(diff * p.Lots * 100.0, 2);
                    _simPositions[i] = p with
                    {
                        CurrentPrice = cur,
                        Pips = pips,
                        Profit = profit,
                        NetProfit = Math.Round(profit + p.Swap + p.Commission, 2)
                    };
                }
            }
            EvaluateArmedRules("XAUUSD", _simBid, _simAsk);
            return;
        }

        if (_useTerminalIpc)
        {
            if (_isWaking)
            {
                return;
            }

            if (_isSleeping || Status == "IDLE_SLEEP")
            {
                if (!ShouldIdleSleep() && (DateTime.UtcNow - _lastWakeAttemptUtc).TotalSeconds >= 5)
                {
                    EnsureWorkerAwakeAsync();
                }
                return;
            }

            if (Status == "LIVE")
            {
                if ((DateTime.UtcNow - _lastIpcFetchUtc).TotalMilliseconds > 1500)
                {
                    if (_worker.IsRunning)
                    {
                        var fresh = _worker.TryReadFreshState(maxAgeMs: 5000);
                        if (fresh != null && fresh.Connected && fresh.Authorized)
                        {
                            _lastWorkerState = fresh;
                            _lastIpcFetchUtc = DateTime.UtcNow;
                            CacheQuotesFromWorker(fresh);
                        }
                    }
                    else if (ShouldIdleSleep())
                    {
                        EnterIdleSleep();
                        return;
                    }
                    else if ((DateTime.UtcNow - _lastWakeAttemptUtc).TotalSeconds >= 5)
                    {
                        EnsureWorkerAwakeAsync();
                        return;
                    }
                }

                if (ShouldIdleSleep())
                {
                    EnterIdleSleep();
                    return;
                }

                foreach (var kv in _latestQuotes)
                {
                    if (kv.Value.Bid > 0)
                    {
                        EvaluateArmedRules(kv.Key, kv.Value.Bid, kv.Value.Ask);
                    }
                }
            }
            return;
        }

        // Auto-reconnect watchdog for real MT5 session
        if (!IsSimulation && Status == "LIVE" && _api != null && !_api.Connected)
        {
            Status = "RECONNECTING";
            try
            {
                _api.Connect();
                Status = "LIVE";
                ErrorMessage = null;
                AddActivity("RECONNECT", "Auto-reconnected to broker server", $"{Server} • {LatencyMs} ms", "SYSTEM", "DONE");
            }
            catch (Exception ex)
            {
                ErrorMessage = "Reconnecting: " + ex.Message;
            }
        }
    }

    public void EvaluateArmedRules(string symbol, double bid, double ask)
    {
        List<ArmedRuleDto> toTrigger = new();

        lock (_syncLock)
        {
            // Check price rules
            foreach (var r in _armedRules.Where(x => x.Status == "ARMED"))
            {
                if ((r.Type == "PRICE_BE" || r.Type == "PRICE_CLOSE") &&
                    r.TargetPrice.HasValue &&
                    (string.IsNullOrEmpty(r.Symbol) || SymbolsMatch(r.Symbol, symbol)))
                {
                    var price = bid;
                    bool hit = r.Direction == "BELOW"
                        ? price <= r.TargetPrice.Value
                        : price >= r.TargetPrice.Value;
                    if (hit)
                    {
                        toTrigger.Add(r);
                    }
                }
            }
        }

        // Also check Daily Loss / Profit limits
        var (balance, _, floatingPnl) = GetCapitalSnapshot();
        if (balance > 0)
        {
            var pnlPct = (floatingPnl / balance) * 100.0;
            if (DailyLossLimitPercent < 0 && pnlPct <= DailyLossLimitPercent)
            {
                var limitPct = DailyLossLimitPercent;
                DailyLossLimitPercent = 0; // Disarm after trigger
                ExecuteCommand(new ExecuteCommandRequest(Login, "CLOSE_ALL"), "RULE_24_5", $"Daily Loss Limit ({limitPct:F1}%) hit");
            }
            else if (DailyProfitTargetPercent > 0 && pnlPct >= DailyProfitTargetPercent)
            {
                var targetPct = DailyProfitTargetPercent;
                DailyProfitTargetPercent = 0; // Disarm after trigger
                ExecuteCommand(new ExecuteCommandRequest(Login, "CLOSE_ALL"), "RULE_24_5", $"Daily Profit Target (+{targetPct:F1}%) hit");
            }
        }

        foreach (var rule in toTrigger)
        {
            lock (_syncLock)
            {
                var idx = _armedRules.FindIndex(x => x.Id == rule.Id);
                if (idx >= 0 && _armedRules[idx].Status == "ARMED")
                {
                    _armedRules[idx] = _armedRules[idx] with
                    {
                        Status = "TRIGGERED",
                        TriggeredAt = DateTime.UtcNow
                    };
                }
                else
                {
                    continue;
                }
            }

            if (rule.Type == "PRICE_BE")
            {
                ExecuteCommand(
                    new ExecuteCommandRequest(Login, "BREAKEVEN_ALL", Symbol: rule.Symbol),
                    "RULE_24_5",
                    $"Price Alert BE @ {rule.TargetPrice:F2}"
                );
            }
            else if (rule.Type == "PRICE_CLOSE")
            {
                ExecuteCommand(
                    new ExecuteCommandRequest(Login, "CLOSE_ALL", Symbol: rule.Symbol),
                    "RULE_24_5",
                    $"Price Alert Close @ {rule.TargetPrice:F2}"
                );
            }
        }
    }

    public ExecuteResultDto ExecuteCommand(ExecuteCommandRequest req, string source = "MOBILE", string? reasonPrefix = null)
    {
        if (source == "MOBILE")
        {
            TouchClientAccess(req.Symbol, 0);
        }

        var action = (req.Action ?? "").Trim().ToUpperInvariant();
        int moved = 0;
        int skipped = 0;
        string summaryLabel = action;

        try
        {
            if (IsSimulation)
            {
                return ExecuteSimulationCommand(req, action, source, reasonPrefix);
            }

            if (_useTerminalIpc)
            {
                return ExecuteIpcCommand(req, action, source, reasonPrefix);
            }

            if (_api == null || !_api.Connected)
            {
                throw new InvalidOperationException("MT5 account is not currently connected. Reconnecting...");
            }

            var opened = _api.GetOpenedOrders(OrderSort.OpenTime, false) ?? Array.Empty<Order>();
            var marketPositions = opened
                .Where(o => o != null && (o.OrderType == OrderType.Buy || o.OrderType == OrderType.Sell))
                .Where(o => string.IsNullOrWhiteSpace(req.Symbol) || o.Symbol.Equals(req.Symbol, StringComparison.OrdinalIgnoreCase))
                .ToList();
            var pendingOrders = opened
                .Where(o => o != null && o.OrderType != OrderType.Buy && o.OrderType != OrderType.Sell)
                .ToList();

            switch (action)
            {
                case "BREAKEVEN_ALL":
                case "BE_PLUS_2":
                {
                    double lockPips = action == "BE_PLUS_2" ? 2.0 : 0.0;
                    summaryLabel = action == "BE_PLUS_2" ? "BE +2 pips" : "BE (all symbols)";

                    foreach (var pos in marketPositions)
                    {
                        if (pos.Profit <= 0)
                        {
                            skipped++;
                            continue;
                        }

                        var pipSize = GetPipSize(pos.Symbol);
                        var digits = pos.Digits > 0 ? pos.Digits : GetDefaultDigits(pos.Symbol);
                        var targetSl = pos.OrderType == OrderType.Buy
                            ? Math.Round(pos.OpenPrice + lockPips * pipSize, digits)
                            : Math.Round(pos.OpenPrice - lockPips * pipSize, digits);

                        bool alreadyProtected = pos.OrderType == OrderType.Buy
                            ? pos.StopLoss >= targetSl - (pipSize * 0.1)
                            : (pos.StopLoss > 0 && pos.StopLoss <= targetSl + (pipSize * 0.1));

                        if (alreadyProtected)
                        {
                            skipped++;
                            continue;
                        }

                        try
                        {
                            _api.OrderModify(pos.Ticket, pos.Symbol, pos.Lots, pos.OpenPrice, pos.OrderType, targetSl, pos.TakeProfit);
                            moved++;
                        }
                        catch
                        {
                            skipped++;
                        }
                    }
                    break;
                }

                case "BREAKEVEN_TICKET":
                {
                    summaryLabel = $"BE #{req.Ticket}";
                    var pos = marketPositions.FirstOrDefault(p => p.Ticket == req.Ticket);
                    if (pos == null || pos.Profit <= 0)
                    {
                        skipped = 1;
                    }
                    else
                    {
                        _api.OrderModify(pos.Ticket, pos.Symbol, pos.Lots, pos.OpenPrice, pos.OrderType, pos.OpenPrice, pos.TakeProfit);
                        moved = 1;
                    }
                    break;
                }

                case "SECURE_25":
                case "SECURE_50":
                case "SECURE_70":
                {
                    double pct = action == "SECURE_25" ? 0.25 : action == "SECURE_50" ? 0.50 : 0.70;
                    summaryLabel = $"Secure {(int)(pct * 100)}% on winners";
                    foreach (var pos in marketPositions)
                    {
                        if (pos.Profit <= 0)
                        {
                            skipped++;
                            continue;
                        }
                        var closeLots = Math.Max(0.01, Math.Round(pos.Lots * pct, 2));
                        if (closeLots > pos.Lots) closeLots = pos.Lots;
                        if (TryCloseOrder(pos, closeLots)) moved++;
                        else skipped++;
                    }
                    break;
                }

                case "SECURE_50_TICKET":
                {
                    summaryLabel = $"Secure 50% #{req.Ticket}";
                    var pos = marketPositions.FirstOrDefault(p => p.Ticket == req.Ticket);
                    if (pos == null)
                    {
                        skipped = 1;
                    }
                    else
                    {
                        var closeLots = Math.Max(0.01, Math.Round(pos.Lots * 0.5, 2));
                        if (TryCloseOrder(pos, closeLots)) moved = 1;
                        else skipped = 1;
                    }
                    break;
                }

                case "SECURE_PROFIT_50_PCT":
                {
                    summaryLabel = "Lock 50% floating profit";
                    var winners = marketPositions.Where(p => p.Profit > 0).OrderByDescending(p => p.Profit).ToList();
                    var totalWinProfit = winners.Sum(p => p.Profit);
                    double targetProfit = totalWinProfit * 0.5;
                    double accumulated = 0;

                    foreach (var pos in winners)
                    {
                        if (accumulated >= targetProfit && moved > 0)
                        {
                            skipped++;
                            continue;
                        }
                        if (TryCloseOrder(pos, pos.Lots))
                        {
                            accumulated += pos.Profit;
                            moved++;
                        }
                        else skipped++;
                    }
                    break;
                }

                case "DERISK":
                {
                    summaryLabel = "Derisk exposure";
                    var worstLoser = marketPositions.Where(p => p.Profit < 0).OrderBy(p => p.Profit).FirstOrDefault();
                    var bestWinner = marketPositions.Where(p => p.Profit > 0).OrderByDescending(p => p.Profit).FirstOrDefault();
                    if (worstLoser != null && TryCloseOrder(worstLoser, worstLoser.Lots)) moved++;
                    if (bestWinner != null && TryCloseOrder(bestWinner, bestWinner.Lots)) moved++;
                    if (moved == 0) skipped = marketPositions.Count;
                    break;
                }

                case "TRIM_2":
                {
                    summaryLabel = "Trim 2 latest layers";
                    var latestTwo = marketPositions.OrderByDescending(p => p.OpenTime).Take(2).ToList();
                    foreach (var pos in latestTwo)
                    {
                        if (TryCloseOrder(pos, pos.Lots)) moved++;
                        else skipped++;
                    }
                    break;
                }

                case "CUT_LOSS_5_PIPS":
                {
                    summaryLabel = "Cut losers > -5 pips";
                    foreach (var pos in marketPositions)
                    {
                        var pips = CalculatePositionPips(pos);
                        if (pips <= -5.0)
                        {
                            if (TryCloseOrder(pos, pos.Lots)) moved++;
                            else skipped++;
                        }
                        else
                        {
                            skipped++;
                        }
                    }
                    break;
                }

                case "CANCEL_ORDERS":
                {
                    summaryLabel = "Cancel pending orders";
                    foreach (var ord in pendingOrders)
                    {
                        try
                        {
                            _api.OrderClose(ord.Ticket, ord.Symbol, ord.OpenPrice, ord.Lots, ord.OrderType, 50);
                            moved++;
                        }
                        catch
                        {
                            skipped++;
                        }
                    }
                    break;
                }

                case "CLOSE_TICKET":
                {
                    summaryLabel = $"Close #{req.Ticket}";
                    var pos = marketPositions.FirstOrDefault(p => p.Ticket == req.Ticket);
                    if (pos == null)
                    {
                        skipped = 1;
                    }
                    else
                    {
                        var lots = req.Value is > 0 ? Math.Min(pos.Lots, req.Value.Value) : pos.Lots;
                        if (TryCloseOrder(pos, lots)) moved = 1;
                        else skipped = 1;
                    }
                    break;
                }

                case "CLOSE_ALL":
                {
                    summaryLabel = "CLOSE ALL positions";
                    foreach (var pos in marketPositions)
                    {
                        if (TryCloseOrder(pos, pos.Lots)) moved++;
                        else skipped++;
                    }
                    break;
                }

                default:
                    throw new ArgumentException($"Unsupported action '{action}'");
            }

            var prefix = !string.IsNullOrWhiteSpace(reasonPrefix) ? $"{reasonPrefix} • " : "";
            var msg = $"Done on •••• {Login % 10000:D4}: {prefix}{summaryLabel} — Moved/Closed: {moved} • Skipped: {skipped}";
            var act = AddActivity(action, $"{prefix}{summaryLabel}", $"Moved/Closed: {moved} • Skipped: {skipped}", source, "DONE");
            return new ExecuteResultDto(true, action, moved, skipped, msg, act, GetState(isClientAccess: source == "MOBILE"));
        }
        catch (Exception ex)
        {
            var errAct = AddActivity(action, $"{summaryLabel} failed", ex.Message, source, "ERROR");
            return new ExecuteResultDto(false, action, moved, skipped, ex.Message, errAct, GetState(isClientAccess: source == "MOBILE"));
        }
    }

    private bool TryCloseOrder(Order pos, double lots)
    {
        if (_api == null) return false;
        try
        {
            var quote = _api.GetQuote(pos.Symbol, 1000, 10000);
            var closePrice = pos.OrderType == OrderType.Buy
                ? (quote?.Bid ?? pos.ClosePrice)
                : (quote?.Ask ?? pos.ClosePrice);
            _api.OrderClose(pos.Ticket, pos.Symbol, closePrice, lots, pos.OrderType, 100);
            return true;
        }
        catch
        {
            return false;
        }
    }

    private ExecuteResultDto ExecuteSimulationCommand(ExecuteCommandRequest req, string action, string source, string? reasonPrefix)
    {
        int moved = 0;
        int skipped = 0;
        string summaryLabel = action;

        lock (_syncLock)
        {
            switch (action)
            {
                case "BREAKEVEN_ALL":
                case "BE_PLUS_2":
                {
                    double offset = action == "BE_PLUS_2" ? 0.20 : 0.0;
                    summaryLabel = action == "BE_PLUS_2" ? "BE +2 pips" : "BE (all symbols)";
                    for (int i = 0; i < _simPositions.Count; i++)
                    {
                        var p = _simPositions[i];
                        if (p.Profit <= 0) { skipped++; continue; }
                        var targetSl = p.Type == "BUY"
                            ? Math.Round(p.OpenPrice + offset, 2)
                            : Math.Round(p.OpenPrice - offset, 2);
                        bool already = p.Type == "BUY"
                            ? p.StopLoss >= targetSl - 0.01
                            : (p.StopLoss > 0 && p.StopLoss <= targetSl + 0.01);
                        if (already) { skipped++; continue; }
                        _simPositions[i] = p with { StopLoss = targetSl };
                        moved++;
                    }
                    break;
                }

                case "BREAKEVEN_TICKET":
                {
                    summaryLabel = $"BE #{req.Ticket}";
                    var idx = _simPositions.FindIndex(p => p.Ticket == req.Ticket);
                    if (idx >= 0 && _simPositions[idx].Profit > 0)
                    {
                        var p = _simPositions[idx];
                        _simPositions[idx] = p with { StopLoss = p.OpenPrice };
                        moved = 1;
                    }
                    else skipped = 1;
                    break;
                }

                case "SECURE_25":
                case "SECURE_50":
                case "SECURE_70":
                {
                    double pct = action == "SECURE_25" ? 0.25 : action == "SECURE_50" ? 0.50 : 0.70;
                    summaryLabel = $"Secure {(int)(pct * 100)}% on winners";
                    for (int i = _simPositions.Count - 1; i >= 0; i--)
                    {
                        var p = _simPositions[i];
                        if (p.Profit <= 0) { skipped++; continue; }
                        var closeLots = Math.Max(0.01, Math.Round(p.Lots * pct, 2));
                        var realized = Math.Round(p.Profit * (closeLots / p.Lots), 2);
                        _simBalance = Math.Round(_simBalance + realized, 2);
                        if (closeLots >= p.Lots - 0.001)
                            _simPositions.RemoveAt(i);
                        else
                        {
                            var remRatio = (p.Lots - closeLots) / p.Lots;
                            _simPositions[i] = p with
                            {
                                Lots = Math.Round(p.Lots - closeLots, 2),
                                Profit = Math.Round(p.Profit * remRatio, 2),
                                NetProfit = Math.Round(p.NetProfit * remRatio, 2)
                            };
                        }
                        moved++;
                    }
                    break;
                }

                case "SECURE_50_TICKET":
                {
                    summaryLabel = $"Secure 50% #{req.Ticket}";
                    var idx = _simPositions.FindIndex(p => p.Ticket == req.Ticket);
                    if (idx >= 0)
                    {
                        var p = _simPositions[idx];
                        var closeLots = Math.Max(0.01, Math.Round(p.Lots * 0.5, 2));
                        _simBalance = Math.Round(_simBalance + p.Profit * 0.5, 2);
                        if (closeLots >= p.Lots - 0.001) _simPositions.RemoveAt(idx);
                        else _simPositions[idx] = p with { Lots = Math.Round(p.Lots - closeLots, 2), Profit = Math.Round(p.Profit * 0.5, 2) };
                        moved = 1;
                    }
                    else skipped = 1;
                    break;
                }

                case "SECURE_PROFIT_50_PCT":
                {
                    summaryLabel = "Lock 50% floating profit";
                    var winners = _simPositions.Where(p => p.Profit > 0).OrderByDescending(p => p.Profit).ToList();
                    var target = winners.Sum(p => p.Profit) * 0.5;
                    double acc = 0;
                    foreach (var w in winners)
                    {
                        if (acc >= target && moved > 0) { skipped++; continue; }
                        _simBalance = Math.Round(_simBalance + w.Profit, 2);
                        _simPositions.RemoveAll(x => x.Ticket == w.Ticket);
                        acc += w.Profit;
                        moved++;
                    }
                    break;
                }

                case "DERISK":
                {
                    summaryLabel = "Derisk exposure";
                    var loser = _simPositions.Where(p => p.Profit < 0).OrderBy(p => p.Profit).FirstOrDefault();
                    var winner = _simPositions.Where(p => p.Profit > 0).OrderByDescending(p => p.Profit).FirstOrDefault();
                    if (loser != null) { _simBalance = Math.Round(_simBalance + loser.Profit, 2); _simPositions.RemoveAll(x => x.Ticket == loser.Ticket); moved++; }
                    if (winner != null) { _simBalance = Math.Round(_simBalance + winner.Profit, 2); _simPositions.RemoveAll(x => x.Ticket == winner.Ticket); moved++; }
                    break;
                }

                case "TRIM_2":
                {
                    summaryLabel = "Trim 2 latest layers";
                    var latest = _simPositions.OrderByDescending(p => p.OpenTime).Take(2).ToList();
                    foreach (var l in latest)
                    {
                        _simBalance = Math.Round(_simBalance + l.Profit, 2);
                        _simPositions.RemoveAll(x => x.Ticket == l.Ticket);
                        moved++;
                    }
                    break;
                }

                case "CUT_LOSS_5_PIPS":
                {
                    summaryLabel = "Cut losers > -5 pips";
                    for (int i = _simPositions.Count - 1; i >= 0; i--)
                    {
                        if (_simPositions[i].Pips <= -5.0)
                        {
                            _simBalance = Math.Round(_simBalance + _simPositions[i].Profit, 2);
                            _simPositions.RemoveAt(i);
                            moved++;
                        }
                        else skipped++;
                    }
                    break;
                }

                case "CANCEL_ORDERS":
                {
                    summaryLabel = "Cancel pending orders";
                    moved = _simPending.Count;
                    _simPending.Clear();
                    break;
                }

                case "CLOSE_TICKET":
                {
                    summaryLabel = $"Close #{req.Ticket}";
                    var idx = _simPositions.FindIndex(p => p.Ticket == req.Ticket);
                    if (idx >= 0)
                    {
                        _simBalance = Math.Round(_simBalance + _simPositions[idx].Profit, 2);
                        _simPositions.RemoveAt(idx);
                        moved = 1;
                    }
                    else skipped = 1;
                    break;
                }

                case "CLOSE_ALL":
                {
                    summaryLabel = "CLOSE ALL positions";
                    moved = _simPositions.Count;
                    _simBalance = Math.Round(_simBalance + _simPositions.Sum(x => x.Profit), 2);
                    _simPositions.Clear();
                    break;
                }
            }
        }

        var prefix = !string.IsNullOrWhiteSpace(reasonPrefix) ? $"{reasonPrefix} • " : "";
        var msg = $"Done on •••• {Login % 10000:D4}: {prefix}{summaryLabel} — Moved: {moved} • Skipped: {skipped}";
        var act = AddActivity(action, $"{prefix}{summaryLabel}", $"Moved: {moved} • Skipped: {skipped}", source, "DONE");
        return new ExecuteResultDto(true, action, moved, skipped, msg, act, GetState(isClientAccess: source == "MOBILE"));
    }

    public AccountStateDto ManageRules(ManageRuleRequest req)
    {
        TouchClientAccess(req.Symbol, 0);
        var op = (req.Operation ?? "ADD").Trim().ToUpperInvariant();
        lock (_syncLock)
        {
            if (op == "CLEAR")
            {
                _armedRules.Clear();
                DailyLossLimitPercent = 0;
                DailyProfitTargetPercent = 0;
                AddActivity("CLEAR_RULES", "Cleared all 24/5 armed rules", "All price alerts and daily limits disarmed", "MOBILE", "DONE");
            }
            else if (op == "REMOVE" && !string.IsNullOrWhiteSpace(req.RuleId))
            {
                _armedRules.RemoveAll(r => r.Id == req.RuleId);
            }
            else if (op == "SET_DAILY")
            {
                if (req.Type == "DAILY_LOSS_LIMIT")
                {
                    DailyLossLimitPercent = req.PercentValue ?? 0;
                    var label = DailyLossLimitPercent < 0
                        ? $"Daily Loss Limit armed at {DailyLossLimitPercent:F1}%"
                        : "Daily Loss Limit turned off";
                    AddActivity("DAILY_LIMIT", label, "24/5 Cloud Equity Guard", "MOBILE", "DONE");
                }
                else if (req.Type == "DAILY_PROFIT_TARGET")
                {
                    DailyProfitTargetPercent = req.PercentValue ?? 0;
                    var label = DailyProfitTargetPercent > 0
                        ? $"Daily Profit Target armed at +{DailyProfitTargetPercent:F1}%"
                        : "Daily Profit Target turned off";
                    AddActivity("DAILY_TARGET", label, "24/5 Cloud Equity Guard", "MOBILE", "DONE");
                }
            }
            else if (op == "ADD" && req.TargetPrice is > 0)
            {
                var sym = string.IsNullOrWhiteSpace(req.Symbol) ? GetPrimarySymbol() : req.Symbol.Trim().ToUpperInvariant();
                var curBid = GetCurrentBid(sym);
                var dir = !string.IsNullOrWhiteSpace(req.Direction)
                    ? req.Direction.ToUpperInvariant()
                    : (req.TargetPrice.Value >= curBid ? "ABOVE" : "BELOW");
                var type = (req.Type ?? "PRICE_BE").ToUpperInvariant();
                var label = type == "PRICE_CLOSE"
                    ? $"Close all {sym} @ {req.TargetPrice.Value:F2}"
                    : $"BE all {sym} @ {req.TargetPrice.Value:F2}";

                var rule = new ArmedRuleDto(
                    Guid.NewGuid().ToString("N")[..10],
                    type,
                    sym,
                    req.TargetPrice.Value,
                    null,
                    dir,
                    label,
                    "ARMED",
                    DateTime.UtcNow
                );
                _armedRules.Insert(0, rule);
                AddActivity("ARM_RULE", $"Armed 24/5 rule: {label}", $"Direction: {dir} • Cloud watches 24/5", "MOBILE", "DONE");
            }
        }

        if (_useTerminalIpc && (_isSleeping || !_worker.IsRunning))
        {
            EnsureWorkerAwakeAsync();
        }

        return GetState(isClientAccess: true);
    }

    public AccountStateDto GetState(string? requestedSymbol = null, int timeframeMinutes = 15, bool isClientAccess = true)
    {
        if (isClientAccess)
        {
            TouchClientAccess(requestedSymbol, timeframeMinutes);
        }

        if (IsSimulation)
        {
            return BuildSimulationState(requestedSymbol, timeframeMinutes);
        }

        if (_useTerminalIpc)
        {
            return BuildIpcState(requestedSymbol, timeframeMinutes, isClientAccess);
        }

        var positions = new List<PositionDto>();
        var pendings = new List<PendingOrderDto>();

        if (_api != null && _api.Connected)
        {
            try
            {
                var opened = _api.GetOpenedOrders(OrderSort.OpenTime, false) ?? Array.Empty<Order>();
                foreach (var o in opened)
                {
                    if (o == null) continue;
                    if (o.OrderType == OrderType.Buy || o.OrderType == OrderType.Sell)
                    {
                        var curPrice = GetCurrentPriceForOrder(o);
                        var pips = CalculatePositionPips(o, curPrice);
                        var netProfit = Math.Round(o.Profit + o.Swap + o.Commission, 2);
                        positions.Add(new PositionDto(
                            o.Ticket,
                            o.Symbol,
                            o.OrderType == OrderType.Buy ? "BUY" : "SELL",
                            Math.Round(o.Lots, 2),
                            o.OpenPrice,
                            curPrice,
                            o.StopLoss,
                            o.TakeProfit,
                            Math.Round(o.Profit, 2),
                            Math.Round(o.Swap, 2),
                            Math.Round(o.Commission, 2),
                            netProfit,
                            pips,
                            o.OpenTime,
                            o.Comment ?? ""
                        ));
                    }
                    else
                    {
                        pendings.Add(new PendingOrderDto(
                            o.Ticket,
                            o.Symbol,
                            o.OrderType.ToString().ToUpperInvariant(),
                            Math.Round(o.Lots, 2),
                            o.OpenPrice,
                            o.StopLoss,
                            o.TakeProfit,
                            o.OpenTime,
                            o.Comment ?? ""
                        ));
                    }
                }
            }
            catch { /* ignore transient order read error */ }
        }

        var balance = Math.Round(_api?.Account?.Balance ?? 0, 2);
        var credit = Math.Round(_api?.Account?.Credit ?? 0, 2);
        var floatingPnl = Math.Round(positions.Sum(p => p.NetProfit), 2);
        if (positions.Count == 0 && _api != null)
        {
            floatingPnl = Math.Round(_api.AccountProfit, 2);
        }
        var equity = Math.Round(balance + credit + floatingPnl, 2);
        var margin = Math.Round(_api?.AccountMargin ?? 0, 2);
        var freeMargin = Math.Round(equity - margin, 2);
        var marginLevel = margin > 0 ? Math.Round((equity / margin) * 100.0, 2) : 0;
        var floatingPct = balance > 0 ? Math.Round((floatingPnl / balance) * 100.0, 2) : 0;

        var activeSymbol = !string.IsNullOrWhiteSpace(requestedSymbol)
            ? requestedSymbol.Trim().ToUpperInvariant()
            : (positions.FirstOrDefault()?.Symbol ?? "XAUUSD");

        var activeQuote = GetOrFetchQuote(activeSymbol);
        var candles = GetOrFetchCandles(activeSymbol, timeframeMinutes, activeQuote);
        var summaries = BuildSymbolSummaries(positions);

        List<ArmedRuleDto> rulesCopy;
        List<ActivityItemDto> actsCopy;
        lock (_syncLock)
        {
            rulesCopy = _armedRules.ToList();
            actsCopy = _activities.Take(50).ToList();
        }

        return new AccountStateDto(
            Login,
            Server,
            _api?.AccountCompanyName ?? Server,
            _api?.Account?.UserName ?? UserName ?? $"MT5 #{Login}",
            _api?.AccountCurrency ?? "USD",
            _api?.Account?.Leverage ?? 500,
            _api?.IsInvestor ?? false,
            Server.Contains("Demo", StringComparison.OrdinalIgnoreCase) || Server.Contains("Trial", StringComparison.OrdinalIgnoreCase),
            Connected,
            Status,
            LatencyMs,
            Datacenter,
            balance,
            credit,
            equity,
            floatingPnl,
            floatingPct,
            margin,
            freeMargin,
            marginLevel,
            positions.Count,
            Math.Round(positions.Sum(p => p.Lots), 2),
            DailyLossLimitPercent,
            DailyProfitTargetPercent,
            positions,
            pendings,
            summaries,
            rulesCopy,
            actsCopy,
            activeQuote,
            candles,
            LastQuoteUtc,
            ErrorMessage
        );
    }

    public AdminConnectionDto ToAdminDto()
    {
        var state = GetState(isClientAccess: false);
        return new AdminConnectionDto(
            state.Login,
            state.Server,
            state.CompanyName,
            state.AccountName,
            state.Currency,
            state.IsDemo,
            state.IsInvestor,
            state.Connected,
            state.Status,
            state.LatencyMs,
            state.Datacenter,
            state.Balance,
            state.Equity,
            state.FloatingPnl,
            state.FloatingPnlPercent,
            state.MarginLevel,
            state.FreeMargin,
            state.OpenCount,
            state.TotalLots,
            state.ArmedRules.Count(r => r.Status == "ARMED") + (state.DailyLossLimitPercent < 0 ? 1 : 0) + (state.DailyProfitTargetPercent > 0 ? 1 : 0),
            state.ArmedRules,
            state.RecentActivity.Take(20).ToList(),
            AccountId,
            UserId,
            UserName,
            UserEmail,
            IsUnderIb,
            AccessExpiresAt,
            ConnectedAtUtc,
            LastQuoteUtc,
            ErrorMessage
        );
    }

    private (double Balance, double Equity, double FloatingPnl) GetCapitalSnapshot()
    {
        if (IsSimulation)
        {
            lock (_syncLock)
            {
                var pnl = _simPositions.Sum(p => p.NetProfit);
                return (_simBalance, _simBalance + pnl, pnl);
            }
        }
        if (_useTerminalIpc && _lastWorkerState != null)
        {
            return (_lastWorkerState.Balance, _lastWorkerState.Equity, _lastWorkerState.Profit);
        }
        var bal = _api?.Account?.Balance ?? 0;
        var eq = _api?.AccountEquity ?? bal;
        var prof = _api?.AccountProfit ?? (eq - bal);
        return (bal, eq, prof);
    }

    private QuoteDto? GetOrFetchQuote(string symbol)
    {
        if (_latestQuotes.TryGetValue(symbol, out var q)) return q;
        var suffixMatch = _latestQuotes.FirstOrDefault(kv => SymbolsMatch(kv.Key, symbol)).Value;
        if (suffixMatch != null) return suffixMatch;

        if (_api != null && _api.Connected)
        {
            try
            {
                if (!_api.IsSubscribed(symbol)) _api.Subscribe(symbol);
                var live = _api.GetQuote(symbol, 800, 30000);
                if (live != null)
                {
                    UpdateQuoteCache(live);
                    return _latestQuotes.GetValueOrDefault(symbol);
                }
            }
            catch { /* ignore */ }
        }
        return null;
    }

    private List<CandleDto> GetOrFetchCandles(string symbol, int timeframeMinutes, QuoteDto? currentQuote)
    {
        var key = $"{symbol}_{timeframeMinutes}";
        if (_candleCache.TryGetValue(key, out var cached) &&
            (DateTime.UtcNow - cached.FetchedAt).TotalSeconds < 5 &&
            cached.Candles.Count > 0)
        {
            return UpdateLastCandleWithQuote(cached.Candles, currentQuote);
        }

        if (_api != null && _api.Connected)
        {
            try
            {
                var bars = _api.DownloadQuoteHistoryToday(symbol, timeframeMinutes, 2500);
                if (bars != null && bars.Count > 10)
                {
                    var list = bars
                        .OrderBy(b => b.Time)
                        .TakeLast(200)
                        .Select(b => new CandleDto(
                            new DateTimeOffset(DateTime.SpecifyKind(b.Time, DateTimeKind.Utc)).ToUnixTimeSeconds(),
                            b.OpenPrice,
                            b.HighPrice,
                            b.LowPrice,
                            b.ClosePrice
                        ))
                        .ToList();
                    _candleCache[key] = (DateTime.UtcNow, list);
                    return UpdateLastCandleWithQuote(list, currentQuote);
                }
            }
            catch { /* fallback to synthetic history anchored on current quote */ }
        }

        var anchor = currentQuote?.Bid is > 0 ? currentQuote.Bid : 4135.40;
        var synth = GenerateRealisticCandles(anchor, timeframeMinutes, 200);
        _candleCache[key] = (DateTime.UtcNow, synth);
        return synth;
    }

    private static List<CandleDto> UpdateLastCandleWithQuote(List<CandleDto> candles, QuoteDto? quote)
    {
        if (candles.Count == 0 || quote == null || quote.Bid <= 0) return candles;
        var copy = candles.ToList();
        var last = copy[^1];
        copy[^1] = new CandleDto(
            last.Time,
            last.Open,
            Math.Max(last.High, quote.Bid),
            Math.Min(last.Low, quote.Bid),
            quote.Bid
        );
        return copy;
    }

    private static List<CandleDto> GenerateRealisticCandles(double currentPrice, int tfMinutes, int count)
    {
        var list = new List<CandleDto>(count);
        var nowUnix = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var stepSec = Math.Max(60, tfMinutes * 60);
        nowUnix = (nowUnix / stepSec) * stepSec;

        var rng = new Random(42);
        double price = currentPrice - 12.5;
        for (int i = count - 1; i >= 0; i--)
        {
            var t = nowUnix - (i * stepSec);
            var open = Math.Round(price, 2);
            var delta = (rng.NextDouble() - 0.46) * 2.4;
            var close = i == 0 ? Math.Round(currentPrice, 2) : Math.Round(open + delta, 2);
            var high = Math.Round(Math.Max(open, close) + rng.NextDouble() * 1.4, 2);
            var low = Math.Round(Math.Min(open, close) - rng.NextDouble() * 1.4, 2);
            list.Add(new CandleDto(t, open, high, low, close));
            price = close;
        }
        return list;
    }

    private void InitSimulationState()
    {
        lock (_syncLock)
        {
            if (_simPositions.Count > 0) return;
            _simBalance = 351418.03;
            _simBid = 4135.40;
            _simAsk = 4135.64;

            var baseTime = DateTime.UtcNow.AddHours(-4);
            double[] entries = { 4122.10, 4124.50, 4126.93, 4128.40, 4130.15, 4131.80, 4133.20, 4134.90, 4136.80, 4138.10, 4139.50, 4125.75 };
            for (int i = 0; i < entries.Length; i++)
            {
                bool isBuy = i != 9;
                double lots = i % 3 == 0 ? 0.50 : 0.25;
                double entry = entries[i];
                double cur = isBuy ? _simBid : _simAsk;
                double diff = isBuy ? (cur - entry) : (entry - cur);
                double pips = Math.Round(diff / 0.10, 1);
                double profit = Math.Round(diff * lots * 100.0, 2);

                _simPositions.Add(new PositionDto(
                    50984100 + i,
                    "XAUUSD",
                    isBuy ? "BUY" : "SELL",
                    lots,
                    entry,
                    cur,
                    isBuy ? Math.Round(entry - 15.0, 2) : Math.Round(entry + 15.0, 2),
                    isBuy ? Math.Round(entry + 30.0, 2) : Math.Round(entry - 30.0, 2),
                    profit,
                    -1.20,
                    -1.50,
                    Math.Round(profit - 2.70, 2),
                    pips,
                    baseTime.AddMinutes(i * 14),
                    "TNT Cloud Layer"
                ));
            }

            _simPending.Add(new PendingOrderDto(
                50984901,
                "XAUUSD",
                "BUYLIMIT",
                0.50,
                4115.00,
                4100.00,
                4150.00,
                DateTime.UtcNow.AddMinutes(-35),
                "Pullback entry"
            ));
        }
    }

    private AccountStateDto BuildSimulationState(string? requestedSymbol, int timeframeMinutes)
    {
        List<PositionDto> positions;
        List<PendingOrderDto> pendings;
        List<ArmedRuleDto> rules;
        List<ActivityItemDto> acts;
        double balance;
        double bid;
        double ask;

        lock (_syncLock)
        {
            positions = _simPositions.ToList();
            pendings = _simPending.ToList();
            rules = _armedRules.ToList();
            acts = _activities.Take(50).ToList();
            balance = _simBalance;
            bid = _simBid;
            ask = _simAsk;
        }

        var floatingPnl = Math.Round(positions.Sum(p => p.NetProfit), 2);
        var equity = Math.Round(balance + floatingPnl, 2);
        var totalLots = Math.Round(positions.Sum(p => p.Lots), 2);
        var margin = Math.Round(totalLots * 825.0, 2);
        var freeMargin = Math.Round(equity - margin, 2);
        var marginLevel = margin > 0 ? Math.Round((equity / margin) * 100.0, 2) : 0;
        var floatingPct = balance > 0 ? Math.Round((floatingPnl / balance) * 100.0, 2) : 0;

        var activeQuote = new QuoteDto("XAUUSD", bid, ask, 2.4, LastQuoteUtc);
        var candles = GetOrFetchCandles(requestedSymbol ?? "XAUUSD", timeframeMinutes, activeQuote);
        var summaries = BuildSymbolSummaries(positions);

        return new AccountStateDto(
            Login,
            Server,
            "HF Markets (SV) Ltd. (Cloud Sim)",
            UserName ?? "TheNextTrade Sim Trader",
            "USD",
            500,
            false,
            true,
            true,
            Status,
            LatencyMs,
            Datacenter,
            balance,
            0,
            equity,
            floatingPnl,
            floatingPct,
            margin,
            freeMargin,
            marginLevel,
            positions.Count,
            totalLots,
            DailyLossLimitPercent,
            DailyProfitTargetPercent,
            positions,
            pendings,
            summaries,
            rules,
            acts,
            activeQuote,
            candles,
            LastQuoteUtc,
            null
        );
    }

    private List<SymbolSummaryDto> BuildSymbolSummaries(List<PositionDto> positions)
    {
        return positions
            .GroupBy(p => p.Symbol)
            .Select(g =>
            {
                var q = GetOrFetchQuote(g.Key);
                var buyLots = Math.Round(g.Where(x => x.Type == "BUY").Sum(x => x.Lots), 2);
                var sellLots = Math.Round(g.Where(x => x.Type == "SELL").Sum(x => x.Lots), 2);
                return new SymbolSummaryDto(
                    g.Key,
                    g.Count(),
                    buyLots,
                    sellLots,
                    Math.Round(buyLots + sellLots, 2),
                    Math.Round(g.Sum(x => x.NetProfit), 2),
                    q?.Bid ?? g.First().CurrentPrice,
                    q?.Ask ?? g.First().CurrentPrice
                );
            })
            .ToList();
    }

    private ActivityItemDto AddActivity(string action, string title, string detail, string source, string status)
    {
        var item = new ActivityItemDto(
            Guid.NewGuid().ToString("N")[..10],
            action,
            title,
            detail,
            source,
            status,
            DateTime.UtcNow
        );
        lock (_syncLock)
        {
            _activities.Insert(0, item);
            if (_activities.Count > 100)
                _activities.RemoveRange(100, _activities.Count - 100);
        }
        return item;
    }

    private string GetPrimarySymbol()
    {
        if (IsSimulation) return "XAUUSD";
        if (_useTerminalIpc && _lastWorkerState != null && !string.IsNullOrWhiteSpace(_lastWorkerState.ActiveSymbol))
        {
            return _lastWorkerState.ActiveSymbol;
        }
        try
        {
            var first = _api?.GetOpenedOrders(OrderSort.OpenTime, false)?.FirstOrDefault()?.Symbol;
            if (!string.IsNullOrWhiteSpace(first)) return first;
        }
        catch { /* ignore */ }
        return "XAUUSD";
    }

    private double GetCurrentBid(string symbol)
    {
        if (IsSimulation) return _simBid;
        var q = GetOrFetchQuote(symbol);
        if (q?.Bid is > 0) return q.Bid;
        if (_lastWorkerState?.ActiveBid is > 0 && SymbolsMatch(_lastWorkerState.ActiveSymbol, symbol))
            return _lastWorkerState.ActiveBid;
        return 0;
    }

    private double GetCurrentPriceForOrder(Order o)
    {
        if (_latestQuotes.TryGetValue(o.Symbol, out var q))
        {
            return o.OrderType == OrderType.Buy ? q.Bid : q.Ask;
        }
        return o.ClosePrice > 0 ? o.ClosePrice : o.OpenPrice;
    }

    private double CalculatePositionPips(Order o, double? overrideCurrentPrice = null)
    {
        var cur = overrideCurrentPrice ?? GetCurrentPriceForOrder(o);
        var pipSize = GetPipSize(o.Symbol);
        if (pipSize <= 0) return 0;
        var diff = o.OrderType == OrderType.Buy ? (cur - o.OpenPrice) : (o.OpenPrice - cur);
        return Math.Round(diff / pipSize, 1);
    }

    public static double GetPipSize(string symbol)
    {
        var upper = (symbol ?? "").ToUpperInvariant();
        if (upper.Contains("XAU") || upper.Contains("GOLD")) return 0.10;
        if (upper.Contains("JPY")) return 0.01;
        if (upper.Contains("BTC") || upper.Contains("US30") || upper.Contains("NAS100") || upper.Contains("SPX")) return 1.0;
        return 0.0001;
    }

    public static int GetDefaultDigits(string symbol)
    {
        var upper = (symbol ?? "").ToUpperInvariant();
        if (upper.Contains("XAU") || upper.Contains("GOLD")) return 2;
        if (upper.Contains("JPY")) return 3;
        return 5;
    }

    private static string InferDatacenter(string host, string server)
    {
        var combined = $"{host} {server}".ToLowerInvariant();
        if (combined.Contains("sgp") || combined.Contains("asia") || combined.Contains("hk")) return "Singapore";
        if (combined.Contains("ny") || combined.Contains("us")) return "New York";
        if (combined.Contains("ams") || combined.Contains("eu")) return "Amsterdam";
        return "London";
    }

    public void Disconnect()
    {
        lock (_wakeLock)
        {
            _isDisconnected = true;
            Status = "DISCONNECTED";
            _isSleeping = false;
            _isWaking = false;
            SleepingSinceUtc = null;
            _useTerminalIpc = false;
            _worker.StopWorkerProcessOnly();
            DisposeApi();
        }
    }

    private bool TryConnectViaWorker(out string? authError, out string? otherError)
    {
        authError = null;
        otherError = null;
        try
        {
            var sw = Stopwatch.StartNew();
            var endpoints = _resolver.Resolve(Server);
            string? fallbackHostPort = endpoints.Count > 0 ? $"{endpoints[0].Host}:{endpoints[0].Port}" : null;
            var targetSym = !string.IsNullOrWhiteSpace(_desiredSymbol) ? _desiredSymbol : "XAUUSD";
            var targetTf = _desiredTimeframe > 0 ? _desiredTimeframe : 15;
            var state = _worker.Connect(
                Login,
                Password,
                Server,
                fallbackHostPort,
                timeoutMs: 14000,
                startSymbol: targetSym,
                startTimeframeMinutes: targetTf);
            sw.Stop();

            DisposeApi();
            _isDisconnected = false;
            _useTerminalIpc = true;
            _isSleeping = false;
            _isWaking = false;
            SleepingSinceUtc = null;
            LastClientAccessUtc = DateTime.UtcNow;
            _lastWorkerState = state;
            _lastIpcFetchUtc = DateTime.UtcNow;
            ConnectedAtUtc = DateTime.UtcNow;
            LastQuoteUtc = DateTime.UtcNow;
            Status = "LIVE";
            ErrorMessage = null;
            LatencyMs = (int)Math.Clamp(sw.ElapsedMilliseconds / 20, 8, 65);
            Datacenter = InferDatacenter("", Server);
            CacheQuotesFromWorker(state);

            AddActivity(
                "CONNECT",
                $"Connected to {Server} (••{Login % 10000:D4})",
                $"C# Isolated Background Worker • {Datacenter} • {LatencyMs} ms",
                "SYSTEM",
                "DONE"
            );
            return true;
        }
        catch (UnauthorizedAccessException uex)
        {
            authError = uex.Message;
            return false;
        }
        catch (Exception ex)
        {
            otherError = ex.Message;
            return false;
        }
    }

    private void CacheQuotesFromWorker(Mt5WorkerState state)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(state.ActiveSymbol) && state.ActiveBid > 0)
            {
                var pipSize = GetPipSize(state.ActiveSymbol);
                var spread = pipSize > 0 && state.ActiveAsk > 0
                    ? Math.Round((state.ActiveAsk - state.ActiveBid) / pipSize, 1)
                    : 0;
                _latestQuotes[state.ActiveSymbol] = new QuoteDto(
                    state.ActiveSymbol,
                    state.ActiveBid,
                    state.ActiveAsk > 0 ? state.ActiveAsk : state.ActiveBid,
                    spread,
                    DateTime.UtcNow);
            }

            foreach (var pos in state.Positions)
            {
                if (!string.IsNullOrWhiteSpace(pos.Symbol) && pos.CurrentPrice > 0)
                {
                    _latestQuotes[pos.Symbol] = new QuoteDto(
                        pos.Symbol,
                        pos.CurrentPrice,
                        pos.CurrentPrice,
                        0,
                        DateTime.UtcNow);
                }
            }
            LastQuoteUtc = DateTime.UtcNow;
        }
        catch { /* ignore */ }
    }

    private AccountStateDto BuildIpcState(string? requestedSymbol, int timeframeMinutes, bool isClientAccess)
    {
        var reqSym = string.IsNullOrWhiteSpace(requestedSymbol) ? "" : requestedSymbol.Trim().ToUpperInvariant();
        Mt5WorkerState? state = null;

        if (!isClientAccess)
        {
            // Admin / health snapshot: NEVER wake sleeping worker and NEVER mark DISCONNECTED if sleeping/waking.
            if (!_isSleeping && !_isWaking && _worker.IsRunning &&
                (DateTime.UtcNow - _lastIpcFetchUtc).TotalMilliseconds > 2000)
            {
                var fresh = _worker.TryReadFreshState(maxAgeMs: 5000);
                if (fresh != null && fresh.Connected && fresh.Authorized)
                {
                    _lastWorkerState = fresh;
                    _lastIpcFetchUtc = DateTime.UtcNow;
                    CacheQuotesFromWorker(fresh);
                }
            }
            state = _lastWorkerState;
        }
        else if (_isSleeping || _isWaking || !_worker.IsRunning)
        {
            // Client access while worker is hibernating or waking up:
            // Wake asynchronously in the background and return cached _lastWorkerState immediately (<1ms)
            EnsureWorkerAwakeAsync();
            state = _lastWorkerState;
        }
        else if (_lastWorkerState != null &&
            (DateTime.UtcNow - _lastIpcFetchUtc).TotalMilliseconds < 400 &&
            (string.IsNullOrEmpty(reqSym) || SymbolsMatch(_lastWorkerState.ActiveSymbol, reqSym)) &&
            (_lastWorkerState.ActiveTimeframe == timeframeMinutes || timeframeMinutes <= 0))
        {
            state = _lastWorkerState;
        }
        else
        {
            state = _worker.TryReadFreshState(maxAgeMs: 5000);
            if (state != null && state.Connected && state.Authorized)
            {
                bool symbolChanged = !string.IsNullOrEmpty(reqSym) &&
                                     !SymbolsMatch(state.ActiveSymbol, reqSym);
                bool tfChanged = timeframeMinutes > 0 && state.ActiveTimeframe != timeframeMinutes;
                if (symbolChanged || tfChanged)
                {
                    var targetSym = !string.IsNullOrEmpty(reqSym) ? reqSym : state.ActiveSymbol;
                    var targetTf = timeframeMinutes > 0 ? timeframeMinutes : state.ActiveTimeframe;
                    _worker.SendCommand("SET_CHART", ticket: targetTf, symbol: targetSym, timeoutMs: 2500);
                    state = _worker.TryReadFreshState(maxAgeMs: 5000) ?? state;
                }
                _lastWorkerState = state;
                _lastIpcFetchUtc = DateTime.UtcNow;
                Status = "LIVE";
                ErrorMessage = null;
                CacheQuotesFromWorker(state);
            }
            else
            {
                state = _lastWorkerState;
            }
        }

        var positions = new List<PositionDto>();
        var pendings = new List<PendingOrderDto>();
        string companyName = !string.IsNullOrWhiteSpace(state?.Company) ? state.Company : Server;
        string accountName = !string.IsNullOrWhiteSpace(state?.Name) ? state.Name : (UserName ?? $"MT5 #{Login}");
        string currency = !string.IsNullOrWhiteSpace(state?.Currency) ? state.Currency : "USD";
        int leverage = state?.Leverage is > 0 ? state.Leverage : 500;
        bool isInvestor = false;
        bool isDemo = state != null
            ? state.TradeMode == 0
            : (Server.Contains("Demo", StringComparison.OrdinalIgnoreCase) || Server.Contains("Trial", StringComparison.OrdinalIgnoreCase));
        double balance = state?.Balance ?? 0;
        double credit = 0;
        double equity = state?.Equity ?? balance;
        double margin = state?.Margin ?? 0;
        double freeMargin = state?.FreeMargin ?? (equity - margin);
        double marginLevel = state?.MarginLevel ?? 0;
        var candles = new List<CandleDto>();
        string activeSymbol = !string.IsNullOrEmpty(reqSym)
            ? (!string.IsNullOrWhiteSpace(state?.ActiveSymbol) && SymbolsMatch(state.ActiveSymbol, reqSym) ? state.ActiveSymbol : reqSym)
            : (!string.IsNullOrWhiteSpace(state?.ActiveSymbol) ? state.ActiveSymbol : "XAUUSD");

        if (state != null)
        {
            foreach (var p in state.Positions)
            {
                var pipSize = GetPipSize(p.Symbol);
                var diff = p.Type == "BUY" ? (p.CurrentPrice - p.OpenPrice) : (p.OpenPrice - p.CurrentPrice);
                var pips = pipSize > 0 ? Math.Round(diff / pipSize, 1) : 0;
                var netProfit = Math.Round(p.Profit + p.Swap + p.Commission, 2);
                var openTime = p.OpenTime > 0
                    ? DateTimeOffset.FromUnixTimeSeconds(p.OpenTime).UtcDateTime
                    : DateTime.UtcNow;

                positions.Add(new PositionDto(
                    p.Ticket,
                    p.Symbol,
                    p.Type,
                    Math.Round(p.Volume, 2),
                    p.OpenPrice,
                    p.CurrentPrice,
                    p.Sl,
                    p.Tp,
                    Math.Round(p.Profit, 2),
                    Math.Round(p.Swap, 2),
                    Math.Round(p.Commission, 2),
                    netProfit,
                    pips,
                    openTime,
                    p.Comment
                ));
            }

            if (state.Candles.Count > 0)
            {
                foreach (var c in state.Candles)
                {
                    candles.Add(new CandleDto(c.Time, c.Open, c.High, c.Low, c.Close));
                }
            }
        }

        var floatingPnl = Math.Round(positions.Sum(p => p.NetProfit), 2);
        if (positions.Count == 0 && state != null)
        {
            floatingPnl = Math.Round(state.Profit, 2);
        }
        if (equity <= 0) equity = Math.Round(balance + credit + floatingPnl, 2);
        var floatingPct = balance > 0 ? Math.Round((floatingPnl / balance) * 100.0, 2) : 0;

        var activeQuote = GetOrFetchQuote(activeSymbol);
        if (candles.Count == 0)
        {
            candles = GetOrFetchCandles(activeSymbol, timeframeMinutes, activeQuote);
        }
        var summaries = BuildSymbolSummaries(positions);

        List<ArmedRuleDto> rulesCopy;
        List<ActivityItemDto> actsCopy;
        lock (_syncLock)
        {
            rulesCopy = _armedRules.ToList();
            actsCopy = _activities.Take(50).ToList();
        }

        return new AccountStateDto(
            Login,
            Server,
            companyName,
            accountName,
            currency,
            leverage,
            isInvestor,
            isDemo,
            Connected,
            Status,
            LatencyMs,
            Datacenter,
            balance,
            credit,
            equity,
            floatingPnl,
            floatingPct,
            margin,
            freeMargin,
            marginLevel,
            positions.Count,
            Math.Round(positions.Sum(p => p.Lots), 2),
            DailyLossLimitPercent,
            DailyProfitTargetPercent,
            positions,
            pendings,
            summaries,
            rulesCopy,
            actsCopy,
            activeQuote,
            candles,
            LastQuoteUtc,
            ErrorMessage
        );
    }

    private ExecuteResultDto ExecuteIpcCommand(ExecuteCommandRequest req, string action, string source, string? reasonPrefix)
    {
        if (_isSleeping || _isWaking || !_worker.IsRunning)
        {
            EnsureWorkerAwakeBlocking(timeoutMs: 14000);
        }

        var state = _worker.TryReadFreshState(maxAgeMs: 5000) ?? _lastWorkerState;
        if (state == null || !_worker.IsRunning)
        {
            var errAct = AddActivity(action, $"{action} failed", "Background MT5 worker is not running", source, "ERROR");
            return new ExecuteResultDto(false, action, 0, 0, "Background MT5 worker is not running", errAct, GetState(isClientAccess: source == "MOBILE"));
        }

        var marketPositions = state.Positions
            .Where(p => string.IsNullOrWhiteSpace(req.Symbol) || SymbolsMatch(p.Symbol, req.Symbol))
            .ToList();

        int moved = 0;
        int skipped = 0;
        string summaryLabel = action;

        switch (action)
        {
            case "BREAKEVEN_ALL":
            case "BE_PLUS_2":
            {
                double lockPips = action == "BE_PLUS_2" ? 2.0 : 0.0;
                summaryLabel = action == "BE_PLUS_2" ? "BE +2 pips" : "BE (all symbols)";
                foreach (var pos in marketPositions)
                {
                    if (pos.Profit <= 0) { skipped++; continue; }
                    var pipSize = GetPipSize(pos.Symbol);
                    var digits = pos.Digits > 0 ? pos.Digits : GetDefaultDigits(pos.Symbol);
                    var targetSl = pos.Type == "BUY"
                        ? Math.Round(pos.OpenPrice + lockPips * pipSize, digits)
                        : Math.Round(pos.OpenPrice - lockPips * pipSize, digits);
                    var res = _worker.SendCommand("MODIFY_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, sl: targetSl, tp: pos.Tp);
                    if (res.Ok) moved++;
                    else skipped++;
                }
                break;
            }
            case "BREAKEVEN_TICKET":
            {
                summaryLabel = $"BE #{req.Ticket}";
                var pos = marketPositions.FirstOrDefault(p => p.Ticket == req.Ticket);
                if (pos == null || pos.Profit <= 0) skipped = 1;
                else
                {
                    var res = _worker.SendCommand("MODIFY_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, sl: pos.OpenPrice, tp: pos.Tp);
                    if (res.Ok) moved = 1;
                    else skipped = 1;
                }
                break;
            }
            case "SECURE_25":
            case "SECURE_50":
            case "SECURE_70":
            {
                double pct = action == "SECURE_25" ? 0.25 : action == "SECURE_50" ? 0.50 : 0.70;
                summaryLabel = $"Secure {(int)(pct * 100)}% on winners";
                foreach (var pos in marketPositions)
                {
                    if (pos.Profit <= 0) { skipped++; continue; }
                    var closeLots = Math.Max(0.01, Math.Round(pos.Volume * pct, 2));
                    if (closeLots > pos.Volume) closeLots = pos.Volume;
                    var res = _worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: closeLots);
                    if (res.Ok) moved++;
                    else skipped++;
                }
                break;
            }
            case "SECURE_50_TICKET":
            {
                summaryLabel = $"Secure 50% #{req.Ticket}";
                var pos = marketPositions.FirstOrDefault(p => p.Ticket == req.Ticket);
                if (pos == null) skipped = 1;
                else
                {
                    var closeLots = Math.Max(0.01, Math.Round(pos.Volume * 0.5, 2));
                    var res = _worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: closeLots);
                    if (res.Ok) moved = 1;
                    else skipped = 1;
                }
                break;
            }
            case "SECURE_PROFIT_50_PCT":
            {
                summaryLabel = "Lock 50% floating profit";
                var winners = marketPositions.Where(p => p.Profit > 0).OrderByDescending(p => p.Profit).ToList();
                var targetProfit = winners.Sum(p => p.Profit) * 0.5;
                double accumulated = 0;
                foreach (var pos in winners)
                {
                    if (accumulated >= targetProfit && moved > 0) { skipped++; continue; }
                    var res = _worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: pos.Volume);
                    if (res.Ok) { accumulated += pos.Profit; moved++; }
                    else skipped++;
                }
                break;
            }
            case "DERISK":
            {
                summaryLabel = "Derisk exposure";
                var worstLoser = marketPositions.Where(p => p.Profit < 0).OrderBy(p => p.Profit).FirstOrDefault();
                var bestWinner = marketPositions.Where(p => p.Profit > 0).OrderByDescending(p => p.Profit).FirstOrDefault();
                if (worstLoser != null && _worker.SendCommand("CLOSE_POSITION", ticket: worstLoser.Ticket, symbol: worstLoser.Symbol, volume: worstLoser.Volume).Ok) moved++;
                if (bestWinner != null && _worker.SendCommand("CLOSE_POSITION", ticket: bestWinner.Ticket, symbol: bestWinner.Symbol, volume: bestWinner.Volume).Ok) moved++;
                if (moved == 0) skipped = marketPositions.Count;
                break;
            }
            case "TRIM_2":
            {
                summaryLabel = "Trim 2 latest layers";
                foreach (var pos in marketPositions.OrderByDescending(p => p.OpenTime).Take(2))
                {
                    if (_worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: pos.Volume).Ok) moved++;
                    else skipped++;
                }
                break;
            }
            case "CUT_LOSS_5_PIPS":
            {
                summaryLabel = "Cut losers > -5 pips";
                foreach (var pos in marketPositions)
                {
                    var pipSize = GetPipSize(pos.Symbol);
                    var diff = pos.Type == "BUY" ? (pos.CurrentPrice - pos.OpenPrice) : (pos.OpenPrice - pos.CurrentPrice);
                    var pips = pipSize > 0 ? diff / pipSize : 0;
                    if (pips <= -5.0)
                    {
                        if (_worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: pos.Volume).Ok) moved++;
                        else skipped++;
                    }
                    else skipped++;
                }
                break;
            }
            case "CLOSE_TICKET":
            {
                summaryLabel = $"Close #{req.Ticket}";
                var pos = marketPositions.FirstOrDefault(p => p.Ticket == req.Ticket);
                if (pos == null) skipped = 1;
                else
                {
                    var lots = req.Value is > 0 ? Math.Min(pos.Volume, req.Value.Value) : pos.Volume;
                    if (_worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: lots).Ok) moved = 1;
                    else skipped = 1;
                }
                break;
            }
            case "CLOSE_ALL":
            {
                summaryLabel = "CLOSE ALL positions";
                foreach (var pos in marketPositions)
                {
                    if (_worker.SendCommand("CLOSE_POSITION", ticket: pos.Ticket, symbol: pos.Symbol, volume: pos.Volume).Ok) moved++;
                    else skipped++;
                }
                break;
            }
        }

        var refreshed = _worker.TryReadFreshState(maxAgeMs: 5000);
        if (refreshed != null)
        {
            _lastWorkerState = refreshed;
            _lastIpcFetchUtc = DateTime.UtcNow;
            CacheQuotesFromWorker(refreshed);
        }

        var prefix = !string.IsNullOrWhiteSpace(reasonPrefix) ? $"{reasonPrefix} • " : "";
        var msg = $"Done on •••• {Login % 10000:D4}: {prefix}{summaryLabel} — Moved/Closed: {moved} • Skipped: {skipped}";
        var act = AddActivity(action, $"{prefix}{summaryLabel}", $"Moved/Closed: {moved} • Skipped: {skipped}", source, "DONE");
        return new ExecuteResultDto(true, action, moved, skipped, msg, act, GetState(isClientAccess: source == "MOBILE"));
    }

    private void DisposeApi()
    {
        if (_api != null)
        {
            try
            {
                _api.OnQuote -= OnApiQuote;
                _api.OnOrderUpdate -= OnApiOrderUpdate;
                _api.Disconnect();
            }
            catch { /* ignore */ }
            _api = null;
        }
    }

    public void Dispose()
    {
        Disconnect();
    }
}
