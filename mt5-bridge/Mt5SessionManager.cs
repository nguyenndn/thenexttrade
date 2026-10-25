using System.Collections.Concurrent;
using System.Diagnostics;

namespace Mt5Bridge;

public class Mt5SessionManager : BackgroundService
{
    private readonly ServerResolver _resolver;
    private readonly ConcurrentDictionary<ulong, Mt5AccountSession> _sessions = new();
    private readonly ConcurrentDictionary<ulong, object> _connectLocks = new();
    private readonly DateTime _startedAtUtc = DateTime.UtcNow;

    public Mt5SessionManager(ServerResolver resolver)
    {
        _resolver = resolver;
    }

    public AccountStateDto ConnectAccount(ConnectRequest req)
    {
        if (req.Login == 0)
            throw new ArgumentException("Valid MT5 Login account number is required.");
        if (string.IsNullOrWhiteSpace(req.Password))
            throw new ArgumentException("MT5 Password is required.");
        if (string.IsNullOrWhiteSpace(req.Server))
            throw new ArgumentException("MT5 Broker Server is required.");

        var loginLock = _connectLocks.GetOrAdd(req.Login, _ => new object());
        lock (loginLock)
        {
            if (_sessions.TryGetValue(req.Login, out var existing))
            {
                bool credentialsChanged = existing.Password != req.Password ||
                                          !string.Equals(existing.Server, req.Server.Trim(), StringComparison.OrdinalIgnoreCase);
                existing.UpdateMetadata(req);
                if (!existing.Connected || credentialsChanged)
                {
                    existing.Connect();
                }
                else if (existing.IsSleeping || existing.IsWaking)
                {
                    if (!existing.EnsureWorkerAwakeBlocking())
                    {
                        existing.Connect();
                    }
                }
                return existing.GetState(isClientAccess: true);
            }

            var session = new Mt5AccountSession(req, _resolver);
            try
            {
                session.Connect();
                _sessions[req.Login] = session;
                return session.GetState(isClientAccess: true);
            }
            catch
            {
                try { session.Dispose(); } catch { /* ignore */ }
                throw;
            }
        }
    }

    public bool DisconnectAccount(ulong login)
    {
        if (_sessions.TryRemove(login, out var session))
        {
            session.Dispose();
            return true;
        }
        return false;
    }

    public AccountStateDto? GetState(ulong login, string? symbol = null, int timeframe = 15)
    {
        if (_sessions.TryGetValue(login, out var session))
        {
            return session.GetState(symbol, timeframe, isClientAccess: true);
        }
        return null;
    }

    public ExecuteResultDto Execute(ExecuteCommandRequest req)
    {
        if (!_sessions.TryGetValue(req.Login, out var session))
        {
            throw new KeyNotFoundException($"MT5 Account {req.Login} is not connected to the Cloud Bridge.");
        }
        return session.ExecuteCommand(req, "MOBILE");
    }

    public AccountStateDto ManageRules(ManageRuleRequest req)
    {
        if (!_sessions.TryGetValue(req.Login, out var session))
        {
            throw new KeyNotFoundException($"MT5 Account {req.Login} is not connected to the Cloud Bridge.");
        }
        return session.ManageRules(req);
    }

    public List<AdminConnectionDto> GetAllConnections()
    {
        return _sessions.Values
            .Select(s => s.ToAdminDto())
            .OrderByDescending(c => c.Connected)
            .ThenByDescending(c => c.Status == "LIVE")
            .ThenByDescending(c => c.ConnectedAtUtc)
            .ToList();
    }

    public BridgeHealthDto GetHealth()
    {
        using var proc = Process.GetCurrentProcess();
        var memMb = Math.Round(proc.WorkingSet64 / (1024.0 * 1024.0), 1);
        var uptime = (long)(DateTime.UtcNow - _startedAtUtc).TotalSeconds;
        var connections = GetAllConnections();
        var active = connections.Where(c => c.Connected).ToList();

        return new BridgeHealthDto(
            "ONLINE",
            uptime,
            memMb,
            active.Count,
            connections.Count,
            connections.Sum(c => c.ArmedRulesCount),
            Math.Round(active.Sum(c => c.Equity), 2),
            Math.Round(active.Sum(c => c.FloatingPnl), 2),
            "2.0.0-mtapi5",
            5600,
            DateTime.UtcNow
        );
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                foreach (var session in _sessions.Values)
                {
                    session.TickSimulationAndWatchdog();
                }
            }
            catch
            {
                // Keep background loop alive
            }

            await Task.Delay(1000, stoppingToken);
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        ShutdownAllSessions();
        await base.StopAsync(cancellationToken);
    }

    public override void Dispose()
    {
        ShutdownAllSessions();
        base.Dispose();
    }

    public void ShutdownAllSessions()
    {
        foreach (var kv in _sessions)
        {
            if (_sessions.TryRemove(kv.Key, out var session))
            {
                try { session.Dispose(); } catch { /* ignore */ }
            }
        }
        Mt5WorkerClient.StopAllIsolatedWorkers();
    }
}
