using System.Collections.Concurrent;
using mtapi.mt5;

namespace Mt5Bridge;

public record BrokerEndpoint(string Host, int Port, string ServerName, string CompanyName);

public class ServerResolver
{
    private readonly ConcurrentDictionary<string, List<BrokerEndpoint>> _cache =
        new(StringComparer.OrdinalIgnoreCase);

    public ServerResolver()
    {
        LoadLocalServersDat();
        SeedKnownMajorServers();
    }

    private void LoadLocalServersDat()
    {
        var paths = new List<string>();
        var localDat = Path.Combine(AppContext.BaseDirectory, "servers.dat");
        if (File.Exists(localDat)) paths.Add(localDat);

        var cwdDat = Path.Combine(Directory.GetCurrentDirectory(), "servers.dat");
        if (File.Exists(cwdDat) && !paths.Contains(cwdDat)) paths.Add(cwdDat);

        try
        {
            var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
            var mqDir = Path.Combine(appData, "MetaQuotes", "Terminal");
            if (Directory.Exists(mqDir))
            {
                paths.AddRange(Directory.GetFiles(mqDir, "servers.dat", SearchOption.AllDirectories));
            }
        }
        catch
        {
            // Ignore permission issues on non-Windows environments
        }

        foreach (var path in paths)
        {
            try
            {
                var servers = MT5API.LoadServersDat(path);
                foreach (var s in servers)
                {
                    var name = s.ServerInfoEx?.ServerName ?? s.ServerInfo?.ServerName;
                    var company = s.ServerInfoEx?.CompanyName ?? s.ServerInfo?.CompanyName ?? "";
                    if (string.IsNullOrWhiteSpace(name)) continue;

                    var endpoints = new List<BrokerEndpoint>();
                    if (s.Accesses != null)
                    {
                        foreach (var acc in s.Accesses)
                        {
                            if (acc.Addresses == null) continue;
                            foreach (var addr in acc.Addresses)
                            {
                                if (TryParseHostPort(addr.Address, out var host, out var port))
                                {
                                    endpoints.Add(new BrokerEndpoint(host, port, name, company));
                                }
                            }
                        }
                    }

                    if (endpoints.Count > 0)
                    {
                        _cache.AddOrUpdate(
                            name.Trim(),
                            endpoints,
                            (_, existing) => existing.Concat(endpoints).DistinctBy(x => $"{x.Host}:{x.Port}").ToList()
                        );
                    }
                }
            }
            catch
            {
                // Continue loading remaining files
            }
        }
    }

    private void SeedKnownMajorServers()
    {
        AddSeed("HFMarketsGlobal-Live5", "HF Markets (SV) Ltd.", "mt5-global5.dcglobalfarm.com:20501", "mt5-global5.dcglobalfarm.com:20502", "34.12.71.24:20503", "live5.webterminal-hfm.com:1951");
        AddSeed("HFMarketsGlobal-Demo", "HF Markets (SV) Ltd.", "18.134.38.113:1950", "52.56.175.12:1950", "54.233.231.197:1950");
        AddSeed("MetaQuotes-Demo", "MetaQuotes Ltd.", "access.metatrader5.com:443", "194.164.179.214:443", "194.164.179.213:443");
    }

    private void AddSeed(string serverName, string company, params string[] hostPorts)
    {
        if (_cache.ContainsKey(serverName)) return;
        var list = new List<BrokerEndpoint>();
        foreach (var hp in hostPorts)
        {
            if (TryParseHostPort(hp, out var h, out var p))
                list.Add(new BrokerEndpoint(h, p, serverName, company));
        }
        if (list.Count > 0)
            _cache[serverName] = list;
    }

    public List<BrokerEndpoint> Resolve(string serverOrHostPort)
    {
        var trimmed = (serverOrHostPort ?? "").Trim();
        if (string.IsNullOrEmpty(trimmed))
            return new List<BrokerEndpoint>();

        // 1. Direct cache hit
        if (_cache.TryGetValue(trimmed, out var cached) && cached.Count > 0)
            return cached;

        // 2. Direct host:port syntax (e.g. "mt5-global5.dcglobalfarm.com:20501")
        if (trimmed.Contains(':') && TryParseHostPort(trimmed, out var directHost, out var directPort))
        {
            return new List<BrokerEndpoint>
            {
                new(directHost, directPort, trimmed, "Direct Host")
            };
        }

        // 3. Query MetaQuotes live broker directory via Broker.Search
        var queries = new List<string> { trimmed };
        var dashIdx = trimmed.IndexOf('-');
        if (dashIdx > 2)
        {
            var prefix = trimmed[..dashIdx];
            queries.Add(prefix);
            // Also try common short prefixes (e.g. HFMarketsGlobal -> HFMarkets, ICMarketsSC -> ICMarkets, ExnessBV -> Exness)
            foreach (var root in new[] { "HFMarkets", "Exness", "ICMarkets", "FTMO", "Vantage", "JustMarkets", "Tickmill", "Pepperstone", "Eightcap", "FPMarkets", "XMGlobal", "Bybit", "Deriv" })
            {
                if (prefix.StartsWith(root, StringComparison.OrdinalIgnoreCase) && !queries.Contains(root))
                    queries.Add(root);
            }
        }

        foreach (var q in queries.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            try
            {
                var companies = Broker.Search(q);
                if (companies != null)
                {
                    CacheCompanies(companies);
                }
            }
            catch
            {
                // Ignore search error and try SearchMQ fallback
            }

            if (_cache.TryGetValue(trimmed, out var foundAfterSearch) && foundAfterSearch.Count > 0)
                return foundAfterSearch;

            try
            {
                var mqCompanies = Broker.SearchMQ(q);
                if (mqCompanies != null)
                {
                    CacheCompanies(mqCompanies);
                }
            }
            catch
            {
                // Ignore
            }

            if (_cache.TryGetValue(trimmed, out var foundAfterMq) && foundAfterMq.Count > 0)
                return foundAfterMq;
        }

        // 4. Case-insensitive partial match fallback in cache
        var partial = _cache.FirstOrDefault(kv =>
            kv.Key.Equals(trimmed, StringComparison.OrdinalIgnoreCase) ||
            kv.Key.Replace(" ", "").Equals(trimmed.Replace(" ", ""), StringComparison.OrdinalIgnoreCase));
        if (partial.Value != null && partial.Value.Count > 0)
            return partial.Value;

        return new List<BrokerEndpoint>();
    }

    public List<object> SearchServers(string query)
    {
        if (!string.IsNullOrWhiteSpace(query) && query.Trim().Length >= 2)
        {
            Resolve(query.Trim());
        }

        return _cache
            .Where(kv => string.IsNullOrWhiteSpace(query) || kv.Key.Contains(query.Trim(), StringComparison.OrdinalIgnoreCase))
            .OrderBy(kv => kv.Key)
            .Take(50)
            .Select(kv => (object)new
            {
                server = kv.Key,
                company = kv.Value.FirstOrDefault()?.CompanyName ?? "",
                endpoints = kv.Value.Select(e => $"{e.Host}:{e.Port}").Take(4).ToList()
            })
            .ToList();
    }

    private void CacheCompanies(IList<Broker.Company> companies)
    {
        foreach (var comp in companies)
        {
            if (comp?.results == null) continue;
            var companyName = comp.company ?? "";
            foreach (var r in comp.results)
            {
                if (string.IsNullOrWhiteSpace(r?.name) || r.access == null) continue;
                var list = new List<BrokerEndpoint>();
                foreach (var addr in r.access)
                {
                    if (TryParseHostPort(addr, out var host, out var port))
                    {
                        // Prefer IPv4 / hostname over raw IPv6 brackets for compatibility
                        if (!host.StartsWith('['))
                            list.Add(new BrokerEndpoint(host, port, r.name.Trim(), companyName));
                    }
                }
                if (list.Count > 0)
                {
                    _cache[r.name.Trim()] = list;
                }
            }
        }
    }

    public static bool TryParseHostPort(string? raw, out string host, out int port)
    {
        host = "";
        port = 443;
        if (string.IsNullOrWhiteSpace(raw)) return false;
        var trimmed = raw.Trim();
        var lastColon = trimmed.LastIndexOf(':');
        if (lastColon <= 0 || lastColon == trimmed.Length - 1) return false;

        host = trimmed[..lastColon].Trim();
        if (!int.TryParse(trimmed[(lastColon + 1)..].Trim(), out port))
        {
            port = 443;
            return false;
        }
        if (IsPrivateLanIp(host))
        {
            return false;
        }
        return !string.IsNullOrEmpty(host) && port > 0 && port <= 65535;
    }

    private static bool IsPrivateLanIp(string host)
    {
        if (host.StartsWith("10.", StringComparison.Ordinal) ||
            host.StartsWith("192.168.", StringComparison.Ordinal) ||
            host.StartsWith("127.", StringComparison.Ordinal) ||
            host.StartsWith("169.254.", StringComparison.Ordinal))
        {
            return true;
        }

        if (host.StartsWith("172.", StringComparison.Ordinal))
        {
            var parts = host.Split('.');
            if (parts.Length == 4 && int.TryParse(parts[1], out var second) && second is >= 16 and <= 31)
            {
                return true;
            }
        }

        return false;
    }
}
