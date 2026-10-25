using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using mtapi.mt5;

namespace Mt5Bridge;

public sealed class Mt5WorkerState
{
    [JsonPropertyName("connected")]
    public bool Connected { get; set; }

    [JsonPropertyName("authorized")]
    public bool Authorized { get; set; }

    [JsonPropertyName("login")]
    public ulong Login { get; set; }

    [JsonPropertyName("server")]
    public string Server { get; set; } = "";

    [JsonPropertyName("name")]
    public string Name { get; set; } = "";

    [JsonPropertyName("currency")]
    public string Currency { get; set; } = "USD";

    [JsonPropertyName("company")]
    public string Company { get; set; } = "";

    [JsonPropertyName("leverage")]
    public int Leverage { get; set; } = 100;

    [JsonPropertyName("tradeMode")]
    public int TradeMode { get; set; }

    [JsonPropertyName("balance")]
    public double Balance { get; set; }

    [JsonPropertyName("equity")]
    public double Equity { get; set; }

    [JsonPropertyName("margin")]
    public double Margin { get; set; }

    [JsonPropertyName("freeMargin")]
    public double FreeMargin { get; set; }

    [JsonPropertyName("marginLevel")]
    public double MarginLevel { get; set; }

    [JsonPropertyName("profit")]
    public double Profit { get; set; }

    [JsonPropertyName("serverTime")]
    public long ServerTime { get; set; }

    [JsonPropertyName("activeSymbol")]
    public string ActiveSymbol { get; set; } = "XAUUSD";

    [JsonPropertyName("activeTimeframe")]
    public int ActiveTimeframe { get; set; } = 15;

    [JsonPropertyName("activeBid")]
    public double ActiveBid { get; set; }

    [JsonPropertyName("activeAsk")]
    public double ActiveAsk { get; set; }

    [JsonPropertyName("positions")]
    public List<Mt5WorkerPosition> Positions { get; set; } = new();

    [JsonPropertyName("candles")]
    public List<Mt5WorkerCandle> Candles { get; set; } = new();

    [JsonPropertyName("deals")]
    public List<Mt5WorkerDeal> Deals { get; set; } = new();
}

public sealed class Mt5WorkerCandle
{
    [JsonPropertyName("time")]
    public long Time { get; set; }

    [JsonPropertyName("open")]
    public double Open { get; set; }

    [JsonPropertyName("high")]
    public double High { get; set; }

    [JsonPropertyName("low")]
    public double Low { get; set; }

    [JsonPropertyName("close")]
    public double Close { get; set; }
}

public sealed class Mt5WorkerPosition
{
    [JsonPropertyName("ticket")]
    public long Ticket { get; set; }

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "BUY";

    [JsonPropertyName("volume")]
    public double Volume { get; set; }

    [JsonPropertyName("openPrice")]
    public double OpenPrice { get; set; }

    [JsonPropertyName("currentPrice")]
    public double CurrentPrice { get; set; }

    [JsonPropertyName("sl")]
    public double Sl { get; set; }

    [JsonPropertyName("tp")]
    public double Tp { get; set; }

    [JsonPropertyName("profit")]
    public double Profit { get; set; }

    [JsonPropertyName("swap")]
    public double Swap { get; set; }

    [JsonPropertyName("commission")]
    public double Commission { get; set; }

    [JsonPropertyName("magic")]
    public long Magic { get; set; }

    [JsonPropertyName("comment")]
    public string Comment { get; set; } = "";

    [JsonPropertyName("openTime")]
    public long OpenTime { get; set; }

    [JsonPropertyName("digits")]
    public int Digits { get; set; } = 5;

    [JsonPropertyName("contractSize")]
    public double ContractSize { get; set; } = 100000;

    [JsonPropertyName("tickValue")]
    public double TickValue { get; set; } = 1;

    [JsonPropertyName("tickSize")]
    public double TickSize { get; set; } = 0.00001;
}

public sealed class Mt5WorkerDeal
{
    [JsonPropertyName("ticket")]
    public long Ticket { get; set; }

    [JsonPropertyName("order")]
    public long Order { get; set; }

    [JsonPropertyName("positionId")]
    public long PositionId { get; set; }

    [JsonPropertyName("symbol")]
    public string Symbol { get; set; } = "";

    [JsonPropertyName("type")]
    public string Type { get; set; } = "BUY";

    [JsonPropertyName("volume")]
    public double Volume { get; set; }

    [JsonPropertyName("price")]
    public double Price { get; set; }

    [JsonPropertyName("profit")]
    public double Profit { get; set; }

    [JsonPropertyName("swap")]
    public double Swap { get; set; }

    [JsonPropertyName("commission")]
    public double Commission { get; set; }

    [JsonPropertyName("magic")]
    public long Magic { get; set; }

    [JsonPropertyName("comment")]
    public string Comment { get; set; } = "";

    [JsonPropertyName("time")]
    public long Time { get; set; }
}

public sealed class Mt5WorkerCommandResult
{
    [JsonPropertyName("ok")]
    public bool Ok { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";

    [JsonPropertyName("orderTicket")]
    public long OrderTicket { get; set; }
}

/// <summary>
/// Pure C# manager for an isolated background portable MT5 worker instance (.mt5-workers/{login}/terminal64.exe).
/// Supports Multi-Instance parallel execution across multiple MT5 accounts using Windows Hardlinks (CreateHardLinkW)
/// for zero extra disk footprint and shared executable pages in RAM.
/// Runs on a separate hidden Windows Desktop (CreateDesktopW) so it NEVER shows any UI window or taskbar icon,
/// and NEVER touches or conflicts with the user's main MT5 UI (C:\Program Files\MetaTrader 5\terminal64.exe).
/// </summary>
public sealed class Mt5WorkerClient : IDisposable
{
    private const uint GENERIC_ALL = 0x10000000;
    private const uint STARTF_USESHOWWINDOW = 0x00000001;
    private const short SW_HIDE = 0;
    private const uint BELOW_NORMAL_PRIORITY_CLASS = 0x00004000;
    private const uint QUOTA_LIMITS_HARDWS_MAX_ENABLE = 0x00000004;
    private const uint JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000;
    private const int JobObjectExtendedLimitInformation = 9;
    private const string HiddenDesktopName = "Mt5BridgeHiddenDesktop";
    private static readonly IntPtr MinWorkingSetBytes = (IntPtr)(2 * 1024 * 1024);
    private static readonly IntPtr MaxWorkingSetBytes = (IntPtr)(10 * 1024 * 1024);
    private static readonly IntPtr JobHandle = CreateKillOnCloseJob();
    private static readonly IntPtr HiddenDesktopHandle = CreateHiddenDesktop();
    private static readonly object CompileLock = new();

    [StructLayout(LayoutKind.Sequential)]
    private struct JOBOBJECT_BASIC_LIMIT_INFORMATION
    {
        public long PerProcessUserTimeLimit;
        public long PerJobUserTimeLimit;
        public uint LimitFlags;
        public UIntPtr MinimumWorkingSetSize;
        public UIntPtr MaximumWorkingSetSize;
        public uint ActiveProcessLimit;
        public UIntPtr Affinity;
        public uint PriorityClass;
        public uint SchedulingClass;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct IO_COUNTERS
    {
        public ulong ReadOperationCount;
        public ulong WriteOperationCount;
        public ulong OtherOperationCount;
        public ulong ReadTransferCount;
        public ulong WriteTransferCount;
        public ulong OtherTransferCount;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct JOBOBJECT_EXTENDED_LIMIT_INFORMATION
    {
        public JOBOBJECT_BASIC_LIMIT_INFORMATION BasicLimitInformation;
        public IO_COUNTERS IoInfo;
        public UIntPtr ProcessMemoryLimit;
        public UIntPtr JobMemoryLimit;
        public UIntPtr PeakProcessMemoryUsed;
        public UIntPtr PeakJobMemoryUsed;
    }

    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct STARTUPINFO
    {
        public int cb;
        public string? lpReserved;
        public string? lpDesktop;
        public string? lpTitle;
        public int dwX;
        public int dwY;
        public int dwXSize;
        public int dwYSize;
        public int dwXCountChars;
        public int dwYCountChars;
        public int dwFillAttribute;
        public int dwFlags;
        public short wShowWindow;
        public short cbReserved2;
        public IntPtr lpReserved2;
        public IntPtr hStdInput;
        public IntPtr hStdOutput;
        public IntPtr hStdError;
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct PROCESS_INFORMATION
    {
        public IntPtr hProcess;
        public IntPtr hThread;
        public int dwProcessId;
        public int dwThreadId;
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateDesktopW(
        string lpszDesktop,
        IntPtr lpszDevice,
        IntPtr pDevmode,
        int dwFlags,
        uint dwDesiredAccess,
        IntPtr lpsa);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CreateProcessW(
        string? lpApplicationName,
        StringBuilder lpCommandLine,
        IntPtr lpProcessAttributes,
        IntPtr lpThreadAttributes,
        bool bInheritHandles,
        uint dwCreationFlags,
        IntPtr lpEnvironment,
        string? lpCurrentDirectory,
        ref STARTUPINFO lpStartupInfo,
        out PROCESS_INFORMATION lpProcessInformation);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CreateHardLinkW(
        string lpFileName,
        string lpExistingFileName,
        IntPtr lpSecurityAttributes);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool CloseHandle(IntPtr hObject);

    [DllImport("psapi.dll", SetLastError = true)]
    private static extern bool EmptyWorkingSet(IntPtr hProcess);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetProcessWorkingSetSizeEx(
        IntPtr hProcess,
        IntPtr dwMinimumWorkingSetSize,
        IntPtr dwMaximumWorkingSetSize,
        uint Flags);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetPriorityClass(IntPtr hProcess, uint dwPriorityClass);

    [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern IntPtr CreateJobObjectW(IntPtr lpJobAttributes, string? lpName);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool SetInformationJobObject(
        IntPtr hJob,
        int infoType,
        IntPtr lpJobObjectInfo,
        uint cbJobObjectInfoLength);

    [DllImport("kernel32.dll", SetLastError = true)]
    private static extern bool AssignProcessToJobObject(IntPtr hJob, IntPtr hProcess);

    private static IntPtr CreateHiddenDesktop()
    {
        try
        {
            return CreateDesktopW(HiddenDesktopName, IntPtr.Zero, IntPtr.Zero, 0, GENERIC_ALL, IntPtr.Zero);
        }
        catch
        {
            return IntPtr.Zero;
        }
    }

    private static IntPtr CreateKillOnCloseJob()
    {
        try
        {
            IntPtr hJob = CreateJobObjectW(IntPtr.Zero, null);
            if (hJob == IntPtr.Zero) return IntPtr.Zero;

            var info = new JOBOBJECT_EXTENDED_LIMIT_INFORMATION
            {
                BasicLimitInformation = new JOBOBJECT_BASIC_LIMIT_INFORMATION
                {
                    LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
                }
            };

            int len = Marshal.SizeOf<JOBOBJECT_EXTENDED_LIMIT_INFORMATION>();
            IntPtr ptr = Marshal.AllocHGlobal(len);
            try
            {
                Marshal.StructureToPtr(info, ptr, false);
                SetInformationJobObject(hJob, JobObjectExtendedLimitInformation, ptr, (uint)len);
            }
            finally
            {
                Marshal.FreeHGlobal(ptr);
            }
            return hJob;
        }
        catch
        {
            return IntPtr.Zero;
        }
    }

    private static string ResolveProjectDir()
    {
        var bridgeDir = AppContext.BaseDirectory;
        var projectDir = Path.GetFullPath(Path.Combine(bridgeDir, "..", "..", ".."));
        if (!File.Exists(Path.Combine(projectDir, "mt5-bridge.csproj")))
        {
            projectDir = Directory.GetCurrentDirectory();
        }
        return projectDir;
    }

    private readonly string _projectDir;
    private readonly string _workersRootDir;
    private ulong _login;
    private string _workerDir;
    private string _workerExePath;
    private string _filesDir;
    private string _stateFilePath;
    private readonly object _cmdLock = new();
    private readonly object _lifecycleLock = new();
    private int? _workerPid;
    private volatile bool _stoppedIntentionally;
    private static bool _legacySingleWorkerChecked;
    private static int _cachedTerminalBuild;
    private DateTime _lastMemoryTrimUtc = DateTime.MinValue;
    private string _cachedServerKey = "";
    private string _cachedTargetServer = "";

    public ulong Login => _login;

    public Mt5WorkerClient(ulong login = 0)
    {
        _projectDir = ResolveProjectDir();
        _workersRootDir = Path.Combine(_projectDir, ".mt5-workers");
        _workerDir = "";
        _workerExePath = "";
        _filesDir = "";
        _stateFilePath = "";
        BindLogin(login);
    }

    private void BindLogin(ulong login)
    {
        if (login > 0 && _login == login && !string.IsNullOrEmpty(_workerDir))
            return;

        _login = login;
        string folderName = login > 0 ? login.ToString() : "default";
        _workerDir = Path.Combine(_workersRootDir, folderName);
        _workerExePath = Path.Combine(_workerDir, "terminal64.exe");
        _filesDir = Path.Combine(_workerDir, "MQL5", "Files");
        _stateFilePath = Path.Combine(_filesDir, "state.json");
    }

    public bool IsRunning
    {
        get
        {
            using var proc = FindWorkerProcess();
            return proc != null && !proc.HasExited;
        }
    }

    public Mt5WorkerState Connect(
        ulong login,
        string password,
        string server,
        string? fallbackHostPort = null,
        int timeoutMs = 15000,
        string startSymbol = "XAUUSD",
        int startTimeframeMinutes = 15)
    {
        lock (_lifecycleLock)
        {
            BindLogin(login);
            if (!_legacySingleWorkerChecked)
            {
                _legacySingleWorkerChecked = true;
                StopLegacySingleWorkerProcess();
            }

            // 1. Fast path: if already running and authorized on this exact login, return immediately without touching disk
            var existingState = TryReadFreshState(maxAgeMs: 3500);
            if (existingState != null && existingState.Connected && existingState.Authorized && existingState.Login == login && IsRunning)
            {
                TrimWorkerMemory(force: true);
                return existingState;
            }

            // 2. Stop only THIS account's isolated .mt5-workers/{login}/terminal64.exe if stale so no files are locked
            StopWorkerProcessOnly();

            // 3. Provision hardlinks, configs, and EA while directory is unlocked
            EnsureWorkerEnvironment(login, password, server, fallbackHostPort, startSymbol, startTimeframeMinutes);

            if (File.Exists(_stateFilePath))
            {
                try { File.Delete(_stateFilePath); } catch { /* ignore */ }
            }

            ClearWorkerLogs();

            string configIniPath = Path.Combine(_workerDir, "config", "worker.ini");
            LaunchHiddenWorkerProcess(configIniPath);

            try
            {
                var sw = Stopwatch.StartNew();
                Mt5WorkerState? lastState = null;
                while (sw.ElapsedMilliseconds < timeoutMs)
                {
                    var state = TryReadFreshState(maxAgeMs: 5000);
                    if (state != null)
                    {
                        lastState = state;
                        if (state.Connected && state.Authorized && state.Login == login && state.Balance >= 0)
                        {
                            TrimWorkerMemory(force: true);
                            return state;
                        }
                    }

                    if (TryDetectWorkerAuthError(out var authFailureReason))
                    {
                        throw new UnauthorizedAccessException(
                            $"MT5 authentication failed for #{login} on {server}: {authFailureReason}");
                    }

                    if (sw.ElapsedMilliseconds > 3000 && !IsRunning)
                    {
                        throw new InvalidOperationException(
                            $"Background MT5 worker process for #{login} exited unexpectedly during startup.");
                    }

                    Thread.Sleep(200);
                }

                throw new TimeoutException(
                    $"Timeout connecting background MT5 worker for #{login} on {server} " +
                    $"(StateFound={lastState != null}, Connected={lastState?.Connected ?? false}, Authorized={lastState?.Authorized ?? false}, Login={lastState?.Login ?? 0})");
            }
            catch
            {
                // CRITICAL: Always terminate the worker process if Connect fails or times out so no orphan zombie process remains
                StopWorkerProcessOnly();
                throw;
            }
        }
    }

    private void ClearWorkerLogs()
    {
        try
        {
            string logsDir = Path.Combine(_workerDir, "logs");
            if (!Directory.Exists(logsDir))
                return;

            foreach (var file in Directory.GetFiles(logsDir, "*.log"))
            {
                try { File.Delete(file); } catch { /* ignore */ }
            }
        }
        catch
        {
            // Ignore
        }
    }

    private bool TryDetectWorkerAuthError(out string reason)
    {
        reason = "";
        try
        {
            string logsDir = Path.Combine(_workerDir, "logs");
            if (!Directory.Exists(logsDir))
                return false;

            foreach (var logFile in Directory.GetFiles(logsDir, "*.log"))
            {
                string fileName = Path.GetFileName(logFile);
                if (fileName.Equals("metaeditor.log", StringComparison.OrdinalIgnoreCase))
                    continue;

                using var fs = new FileStream(logFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite | FileShare.Delete);
                using var sr = new StreamReader(fs, Encoding.UTF8, detectEncodingFromByteOrderMarks: true);
                while (!sr.EndOfStream)
                {
                    var line = sr.ReadLine();
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    if (line.Contains("authorization on", StringComparison.OrdinalIgnoreCase) &&
                        line.Contains("failed", StringComparison.OrdinalIgnoreCase))
                    {
                        int idx = line.IndexOf("authorization on", StringComparison.OrdinalIgnoreCase);
                        reason = idx >= 0 ? line[idx..].Trim() : line.Trim();
                        return true;
                    }
                }
            }
        }
        catch
        {
            // Ignore transient log read errors
        }
        return false;
    }

    public Mt5WorkerState? TryReadFreshState(int maxAgeMs = 4000)
    {
        try
        {
            if (!File.Exists(_stateFilePath))
                return null;

            var info = new FileInfo(_stateFilePath);
            if ((DateTime.UtcNow - info.LastWriteTimeUtc).TotalMilliseconds > maxAgeMs)
                return null;

            using var fs = new FileStream(_stateFilePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            using var sr = new StreamReader(fs, Encoding.ASCII);
            string json = sr.ReadToEnd();
            if (string.IsNullOrWhiteSpace(json))
                return null;

            var state = JsonSerializer.Deserialize<Mt5WorkerState>(json);
            if (state != null && state.Connected && state.Authorized)
            {
                TrimWorkerMemory(force: false);
            }
            return state;
        }
        catch
        {
            return null;
        }
    }

    public Mt5WorkerCommandResult SendCommand(
        string action,
        long ticket = 0,
        string symbol = "",
        double volume = 0,
        double sl = 0,
        double tp = 0,
        string orderType = "",
        string comment = "",
        int timeoutMs = 8000)
    {
        lock (_cmdLock)
        {
            Directory.CreateDirectory(_filesDir);
            string cmdId = Guid.NewGuid().ToString("N")[..12];
            string reqPath = Path.Combine(_filesDir, "cmd_req.txt");
            string resPath = Path.Combine(_filesDir, $"cmd_res_{cmdId}.json");

            string line = string.Join("|",
                cmdId,
                action,
                ticket.ToString(),
                symbol,
                volume.ToString(System.Globalization.CultureInfo.InvariantCulture),
                sl.ToString(System.Globalization.CultureInfo.InvariantCulture),
                tp.ToString(System.Globalization.CultureInfo.InvariantCulture),
                orderType,
                comment.Replace("|", " "));

            File.WriteAllText(reqPath, line, Encoding.ASCII);

            var sw = Stopwatch.StartNew();
            while (sw.ElapsedMilliseconds < timeoutMs)
            {
                if (File.Exists(resPath))
                {
                    try
                    {
                        using var fs = new FileStream(resPath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
                        using var sr = new StreamReader(fs, Encoding.ASCII);
                        string json = sr.ReadToEnd();
                        fs.Close();
                        try { File.Delete(resPath); } catch { /* ignore */ }

                        var res = JsonSerializer.Deserialize<Mt5WorkerCommandResult>(json);
                        if (res != null)
                            return res;
                    }
                    catch
                    {
                        // Wait a bit if file is still being written
                    }
                }
                Thread.Sleep(50);
            }

            return new Mt5WorkerCommandResult
            {
                Ok = false,
                Message = $"Timeout waiting for MT5 worker command {action} response"
            };
        }
    }

    private bool IsServerInWorkerDat(string serverName)
    {
        try
        {
            string datPath = Path.Combine(_workerDir, "config", "servers.dat");
            if (!File.Exists(datPath)) return false;
            var servers = MT5API.LoadServersDat(datPath);
            foreach (var s in servers)
            {
                var name = s.ServerInfoEx?.ServerName ?? s.ServerInfo?.ServerName;
                if (string.Equals(name?.Trim(), serverName.Trim(), StringComparison.OrdinalIgnoreCase))
                    return true;
            }
        }
        catch { /* ignore */ }
        return false;
    }

    private void ProvisionHardlinkedBinary(string binaryName, bool required)
    {
        string targetPath = Path.Combine(_workerDir, binaryName);
        if (File.Exists(targetPath))
            return;

        string sourceExe = Path.Combine(@"C:\Program Files\MetaTrader 5", binaryName);
        string legacyExe = Path.Combine(_projectDir, ".mt5-worker", binaryName);
        string baseStem = Path.GetFileNameWithoutExtension(binaryName);
        string baseExe = Path.Combine(_workersRootDir, $"{baseStem}.base.exe");

        lock (CompileLock)
        {
            if (!File.Exists(baseExe))
            {
                bool baseLinked = false;
                if (File.Exists(legacyExe))
                {
                    try
                    {
                        baseLinked = CreateHardLinkW(baseExe, legacyExe, IntPtr.Zero) && File.Exists(baseExe);
                    }
                    catch
                    {
                        baseLinked = false;
                    }
                }

                if (!baseLinked)
                {
                    string seedSource = File.Exists(sourceExe) ? sourceExe : legacyExe;
                    if (!File.Exists(seedSource))
                    {
                        if (required)
                            throw new FileNotFoundException($"MetaTrader 5 binary not found at {sourceExe}");
                        return;
                    }

                    File.Copy(seedSource, baseExe, overwrite: true);
                }
            }
        }

        if (!File.Exists(baseExe))
            return;

        bool linked = false;
        try
        {
            linked = CreateHardLinkW(targetPath, baseExe, IntPtr.Zero) && File.Exists(targetPath);
        }
        catch
        {
            linked = false;
        }

        if (!linked)
        {
            File.Copy(baseExe, targetPath, overwrite: true);
        }
    }

    private static string FormatIniPeriod(int timeframeMinutes) => timeframeMinutes switch
    {
        1 => "M1",
        5 => "M5",
        15 => "M15",
        30 => "M30",
        60 => "H1",
        240 => "H4",
        1440 => "D1",
        _ => "M15"
    };

    private static (int PeriodType, int PeriodSize) FormatChrPeriod(int timeframeMinutes) => timeframeMinutes switch
    {
        1 => (0, 1),
        5 => (0, 5),
        15 => (0, 15),
        30 => (0, 30),
        60 => (1, 1),
        240 => (1, 4),
        1440 => (2, 1),
        _ => (0, 15)
    };

    private void EnsureWorkerEnvironment(
        ulong login,
        string password,
        string server,
        string? fallbackHostPort = null,
        string startSymbol = "XAUUSD",
        int startTimeframeMinutes = 15)
    {
        Directory.CreateDirectory(_workersRootDir);
        Directory.CreateDirectory(_workerDir);
        Directory.CreateDirectory(Path.Combine(_workerDir, "config"));
        Directory.CreateDirectory(Path.Combine(_workerDir, "MQL5", "Experts"));
        Directory.CreateDirectory(Path.Combine(_workerDir, "MQL5", "Files"));
        Directory.CreateDirectory(Path.Combine(_workerDir, "MQL5", "Profiles", "Charts", "Default"));
        Directory.CreateDirectory(Path.Combine(_workerDir, "Profiles", "Charts", "Default"));

        // 1. Provision terminal64.exe, MetaEditor64.exe, and metatester64.exe via Windows Hardlink
        // (0 MB extra disk space per account, shared RAM image pages, and prevents MT5 LiveUpdate from downloading 138 MB per worker).
        ProvisionHardlinkedBinary("terminal64.exe", required: true);
        ProvisionHardlinkedBinary("MetaEditor64.exe", required: false);
        ProvisionHardlinkedBinary("metatester64.exe", required: false);

        // 2. Copy the most complete (largest) servers.dat, accounts.dat, dnsperf.dat (NEVER copy user's bloated terminal.ini)
        // Fast-wake optimization: skip scanning AppData if servers.dat is already provisioned in this worker's config folder.
        string workerServersDat = Path.Combine(_workerDir, "config", "servers.dat");
        if (!File.Exists(workerServersDat) || new FileInfo(workerServersDat).Length < 1024)
        {
            var candidateConfigDirs = new List<string>();
            string appDataTerminals = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "MetaQuotes", "Terminal");
            if (Directory.Exists(appDataTerminals))
            {
                foreach (var dir in Directory.GetDirectories(appDataTerminals))
                {
                    string cfgDir = Path.Combine(dir, "config");
                    if (Directory.Exists(cfgDir))
                        candidateConfigDirs.Add(cfgDir);
                }
            }

            string legacyConfigDir = Path.Combine(_projectDir, ".mt5-worker", "config");
            if (Directory.Exists(legacyConfigDir))
                candidateConfigDirs.Add(legacyConfigDir);

            foreach (var fileName in new[] { "servers.dat", "accounts.dat", "dnsperf.dat" })
            {
                string? bestSource = null;
                long bestLength = 0;

                foreach (var cfgDir in candidateConfigDirs)
                {
                    string candidate = Path.Combine(cfgDir, fileName);
                    if (File.Exists(candidate))
                    {
                        long len = new FileInfo(candidate).Length;
                        if (len > bestLength)
                        {
                            bestLength = len;
                            bestSource = candidate;
                        }
                    }
                }

                if (fileName == "servers.dat")
                {
                    string rootServersDat = Path.Combine(_projectDir, "servers.dat");
                    if (File.Exists(rootServersDat))
                    {
                        long len = new FileInfo(rootServersDat).Length;
                        if (len > bestLength)
                        {
                            bestLength = len;
                            bestSource = rootServersDat;
                        }
                    }
                }

                if (bestSource != null)
                {
                    string destFile = Path.Combine(_workerDir, "config", fileName);
                    long currentLen = File.Exists(destFile) ? new FileInfo(destFile).Length : 0;
                    if (currentLen < bestLength)
                    {
                        try { File.Copy(bestSource, destFile, overwrite: true); } catch { /* ignore if locked */ }
                    }
                }
            }
        }

        // 3. Ensure Mt5BridgeWorker.ex5 is compiled once and copied into .mt5-workers/{login}/MQL5/Experts/Mt5BridgeWorker.ex5
        string mq5Source = Path.Combine(_projectDir, "MQL5", "Mt5BridgeWorker.mq5");
        string ex5Compiled = Path.Combine(_projectDir, "MQL5", "Mt5BridgeWorker.ex5");
        string metaEditor = @"C:\Program Files\MetaTrader 5\MetaEditor64.exe";

        lock (CompileLock)
        {
            bool needsCompile = !File.Exists(ex5Compiled) ||
                                (File.Exists(mq5Source) && File.GetLastWriteTimeUtc(mq5Source) > File.GetLastWriteTimeUtc(ex5Compiled));
            if (needsCompile && File.Exists(mq5Source) && File.Exists(metaEditor))
            {
                var psi = new ProcessStartInfo
                {
                    FileName = metaEditor,
                    Arguments = $"/compile:\"{mq5Source}\" /log:\"{Path.Combine(_projectDir, "MQL5", "compile.log")}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                };
                using var p = Process.Start(psi);
                p?.WaitForExit(10000);
            }
        }

        string destEx5 = Path.Combine(_workerDir, "MQL5", "Experts", "Mt5BridgeWorker.ex5");
        if (File.Exists(ex5Compiled) && (!File.Exists(destEx5) || File.GetLastWriteTimeUtc(ex5Compiled) > File.GetLastWriteTimeUtc(destEx5)))
        {
            try { File.Copy(ex5Compiled, destEx5, overwrite: true); } catch { /* ignore if locked by running worker */ }
        }

        // Remove default unpacked MQL5 example folders if present so MT5 never wastes startup time compiling 140+ sample .mq5 files
        foreach (var sampleRelPath in new[]
        {
            Path.Combine("MQL5", "Experts", "Examples"),
            Path.Combine("MQL5", "Experts", "Advisors"),
            Path.Combine("MQL5", "Experts", "Free Robots"),
            Path.Combine("MQL5", "Indicators", "Examples"),
            Path.Combine("MQL5", "Scripts", "Examples")
        })
        {
            string sampleDir = Path.Combine(_workerDir, sampleRelPath);
            if (Directory.Exists(sampleDir))
            {
                try { Directory.Delete(sampleDir, recursive: true); } catch { /* ignore */ }
            }
        }

        string cleanSym = string.IsNullOrWhiteSpace(startSymbol) ? "XAUUSD" : startSymbol.Trim().ToUpperInvariant();
        string iniPeriod = FormatIniPeriod(startTimeframeMinutes);
        var (chrPeriodType, chrPeriodSize) = FormatChrPeriod(startTimeframeMinutes);

        // 4. Write Default profile chart01.chr with Mt5BridgeWorker attached (expertmode=5 = Allow Live Trading, tradehistory=0 = no 28MB deal objects)
        string chartChrContent =
            "<chart>\r\n" +
            "id=134005802920327349\r\n" +
            $"symbol={cleanSym}\r\n" +
            $"period_type={chrPeriodType}\r\n" +
            $"period_size={chrPeriodSize}\r\n" +
            "digits=2\r\n" +
            "tradehistory=0\r\n" +
            "window_type=3\r\n" +
            "windows_total=1\r\n\r\n" +
            "<expert>\r\n" +
            "name=Mt5BridgeWorker\r\n" +
            "path=Experts\\Mt5BridgeWorker.ex5\r\n" +
            "expertmode=5\r\n" +
            "<inputs>\r\n" +
            "</inputs>\r\n" +
            "</expert>\r\n\r\n" +
            "<window>\r\n" +
            "height=100.000000\r\n" +
            "objects=0\r\n" +
            "<indicator>\r\n" +
            "name=Main\r\n" +
            "path=\r\n" +
            "apply=1\r\n" +
            "show_data=0\r\n" +
            "scale_inherit=0\r\n" +
            "scale_line=0\r\n" +
            "scale_line_percent=50\r\n" +
            "scale_line_value=0.000000\r\n" +
            "scale_fix_min=0\r\n" +
            "scale_fix_min_val=0.000000\r\n" +
            "scale_fix_max=0\r\n" +
            "scale_fix_max_val=0.000000\r\n" +
            "expertmode=0\r\n" +
            "fixed_height=-1\r\n" +
            "</indicator>\r\n" +
            "</window>\r\n" +
            "</chart>\r\n";

        foreach (var profileDir in new[]
        {
            Path.Combine(_workerDir, "MQL5", "Profiles", "Charts", "Default"),
            Path.Combine(_workerDir, "Profiles", "Charts", "Default")
        })
        {
            try
            {
                if (Directory.Exists(profileDir))
                {
                    foreach (var chrFile in Directory.GetFiles(profileDir, "*.chr"))
                    {
                        if (!string.Equals(Path.GetFileName(chrFile), "chart01.chr", StringComparison.OrdinalIgnoreCase))
                        {
                            try { File.Delete(chrFile); } catch { /* ignore */ }
                        }
                    }
                }
                File.WriteAllText(Path.Combine(profileDir, "chart01.chr"), chartChrContent, Encoding.Unicode);
                File.WriteAllText(Path.Combine(profileDir, "order.wnd"), "chart01.chr\r\n", Encoding.Unicode);
            }
            catch { /* ignore */ }
        }

        // If the user logs into a brand-new broker that is NOT yet in servers.dat, pass the online-resolved Host:Port directly!
        // Cache the resolved targetServer so wake-ups from idle sleep don't re-parse the 1.3 MB servers.dat.
        string serverKey = $"{server}|{fallbackHostPort}";
        string targetServer;
        if (string.Equals(_cachedServerKey, serverKey, StringComparison.Ordinal) && !string.IsNullOrEmpty(_cachedTargetServer))
        {
            targetServer = _cachedTargetServer;
        }
        else
        {
            targetServer = IsServerInWorkerDat(server) || string.IsNullOrWhiteSpace(fallbackHostPort)
                ? server
                : fallbackHostPort;
            _cachedServerKey = serverKey;
            _cachedTargetServer = targetServer;
        }

        int terminalBuild = _cachedTerminalBuild > 0 ? _cachedTerminalBuild : 6230;
        if (_cachedTerminalBuild <= 0)
        {
            try
            {
                if (File.Exists(_workerExePath))
                {
                    int detectedBuild = FileVersionInfo.GetVersionInfo(_workerExePath).FilePrivatePart;
                    if (detectedBuild > 0)
                    {
                        terminalBuild = detectedBuild;
                        _cachedTerminalBuild = detectedBuild;
                    }
                }
            }
            catch { /* fallback to 6230 */ }
        }

        // 5. Write ultra-lean config/worker.ini, config/common.ini, and config/terminal.ini (UTF-16LE)
        // Including [LiveUpdate] LastBuildDataPath=<build> prevents MT5 from unpacking 453 sample .mq5 files or running full recompilation on launch.
        string iniContent =
            "[Common]\r\n" +
            $"Login={login}\r\n" +
            $"Password={password}\r\n" +
            $"Server={targetServer}\r\n" +
            "KeepPrivate=1\r\n" +
            "ProxyEnable=0\r\n" +
            "CertInstall=0\r\n" +
            "NewsEnable=0\r\n" +
            "MQL5Login=\r\n\r\n" +
            "[Charts]\r\n" +
            "ProfileLast=Default\r\n" +
            "MaxBars=500\r\n" +
            "PrintColor=0\r\n" +
            "SaveDeleted=0\r\n\r\n" +
            "[Experts]\r\n" +
            "AllowDllImport=1\r\n" +
            "Enabled=1\r\n" +
            "Account=0\r\n" +
            "Profile=0\r\n" +
            "DisableOpenCL=1\r\n\r\n" +
            "[LiveUpdate]\r\n" +
            $"LastBuildDataPath={terminalBuild}\r\n\r\n" +
            "[StartUp]\r\n" +
            "Expert=Mt5BridgeWorker\r\n" +
            $"Symbol={cleanSym}\r\n" +
            $"Period={iniPeriod}\r\n";

        try { File.WriteAllText(Path.Combine(_workerDir, "config", "worker.ini"), iniContent, Encoding.Unicode); } catch { /* ignore */ }
        try { File.WriteAllText(Path.Combine(_workerDir, "config", "common.ini"), iniContent, Encoding.Unicode); } catch { /* ignore */ }
        try { File.WriteAllText(Path.Combine(_workerDir, "config", "terminal.ini"), iniContent, Encoding.Unicode); } catch { /* ignore if locked */ }
    }

    private void LaunchHiddenWorkerProcess(string configIniPath)
    {
        var si = new STARTUPINFO
        {
            cb = Marshal.SizeOf<STARTUPINFO>(),
            lpDesktop = HiddenDesktopHandle != IntPtr.Zero ? HiddenDesktopName : null,
            dwFlags = (int)STARTF_USESHOWWINDOW,
            wShowWindow = SW_HIDE
        };

        var cmdLine = new StringBuilder($"\"{_workerExePath}\" /portable /config:\"{configIniPath}\"");
        bool created = CreateProcessW(
            _workerExePath,
            cmdLine,
            IntPtr.Zero,
            IntPtr.Zero,
            false,
            0,
            IntPtr.Zero,
            _workerDir,
            ref si,
            out var pi);

        if (!created)
        {
            int err = Marshal.GetLastWin32Error();
            throw new InvalidOperationException($"Failed to launch background MT5 worker process (Win32 error {err})");
        }

        _workerPid = pi.dwProcessId;
        _stoppedIntentionally = false;
        try
        {
            if (JobHandle != IntPtr.Zero)
                AssignProcessToJobObject(JobHandle, pi.hProcess);
        }
        catch { /* ignore */ }
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
    }

    public void TrimWorkerMemory(bool force = false)
    {
        var now = DateTime.UtcNow;
        if (!force && (now - _lastMemoryTrimUtc).TotalSeconds < 5)
            return;

        _lastMemoryTrimUtc = now;
        try
        {
            using var proc = FindWorkerProcess();
            if (proc != null && !proc.HasExited)
            {
                if (JobHandle != IntPtr.Zero)
                {
                    try { AssignProcessToJobObject(JobHandle, proc.Handle); } catch { /* ignore if already in job */ }
                }
                SetPriorityClass(proc.Handle, BELOW_NORMAL_PRIORITY_CLASS);
                SetProcessWorkingSetSizeEx(proc.Handle, MinWorkingSetBytes, MaxWorkingSetBytes, QUOTA_LIMITS_HARDWS_MAX_ENABLE);
                EmptyWorkingSet(proc.Handle);
            }

            using var self = Process.GetCurrentProcess();
            EmptyWorkingSet(self.Handle);
        }
        catch
        {
            // Ignore access errors
        }
    }

    private Process? FindWorkerProcess()
    {
        if (string.IsNullOrEmpty(_workerExePath))
            return null;

        if (_workerPid.HasValue)
        {
            Process? p = null;
            try
            {
                p = Process.GetProcessById(_workerPid.Value);
                if (!p.HasExited && string.Equals(p.ProcessName, "terminal64", StringComparison.OrdinalIgnoreCase))
                {
                    return p;
                }
                p.Dispose();
                _workerPid = null;
            }
            catch
            {
                p?.Dispose();
                _workerPid = null;
            }
        }

        if (_stoppedIntentionally)
            return null;

        string expectedPath = Path.GetFullPath(_workerExePath);
        Process? matched = null;
        foreach (var proc in Process.GetProcessesByName("terminal64"))
        {
            if (matched != null)
            {
                proc.Dispose();
                continue;
            }

            try
            {
                string? modulePath = proc.MainModule?.FileName;
                if (!string.IsNullOrEmpty(modulePath) &&
                    string.Equals(Path.GetFullPath(modulePath), expectedPath, StringComparison.OrdinalIgnoreCase))
                {
                    _workerPid = proc.Id;
                    matched = proc;
                    continue;
                }
            }
            catch
            {
                // Ignore processes we can't inspect
            }

            proc.Dispose();
        }

        return matched;
    }

    private void StopLegacySingleWorkerProcess()
    {
        try
        {
            string legacyExePath = Path.GetFullPath(Path.Combine(_projectDir, ".mt5-worker", "terminal64.exe"));
            foreach (var proc in Process.GetProcessesByName("terminal64"))
            {
                using (proc)
                {
                    try
                    {
                        string? modulePath = proc.MainModule?.FileName;
                        if (!string.IsNullOrEmpty(modulePath) &&
                            string.Equals(Path.GetFullPath(modulePath), legacyExePath, StringComparison.OrdinalIgnoreCase))
                        {
                            proc.Kill(entireProcessTree: true);
                            proc.WaitForExit(3000);
                        }
                    }
                    catch { /* ignore */ }
                }
            }
        }
        catch { /* ignore */ }
    }

    public void StopWorkerProcessOnly()
    {
        _stoppedIntentionally = true;
        if (string.IsNullOrEmpty(_workerExePath))
        {
            _workerPid = null;
            return;
        }

        string expectedPath = Path.GetFullPath(_workerExePath);

        if (_workerPid.HasValue)
        {
            int pid = _workerPid.Value;
            _workerPid = null;
            try
            {
                using var p = Process.GetProcessById(pid);
                if (!p.HasExited && string.Equals(p.ProcessName, "terminal64", StringComparison.OrdinalIgnoreCase))
                {
                    p.Kill(entireProcessTree: true);
                    p.WaitForExit(3000);
                    return;
                }
            }
            catch
            {
                // Fall through if process already exited or needs path scan
            }
        }

        foreach (var proc in Process.GetProcessesByName("terminal64"))
        {
            using (proc)
            {
                try
                {
                    string? modulePath = proc.MainModule?.FileName;
                    // CRITICAL: ONLY stop the process if its executable path matches THIS account's .mt5-workers/{login}/terminal64.exe!
                    // NEVER touch C:\Program Files\MetaTrader 5\terminal64.exe or other accounts' workers!
                    if (!string.IsNullOrEmpty(modulePath) &&
                        string.Equals(Path.GetFullPath(modulePath), expectedPath, StringComparison.OrdinalIgnoreCase))
                    {
                        proc.Kill(entireProcessTree: true);
                        proc.WaitForExit(3000);
                    }
                }
                catch
                {
                    // Ignore
                }
            }
        }
        _workerPid = null;
    }

    public static void StopAllIsolatedWorkers()
    {
        try
        {
            string projectDir = ResolveProjectDir();
            string workersRootPrefix = Path.GetFullPath(Path.Combine(projectDir, ".mt5-workers")) + Path.DirectorySeparatorChar;
            string legacyExePath = Path.GetFullPath(Path.Combine(projectDir, ".mt5-worker", "terminal64.exe"));

            foreach (var proc in Process.GetProcessesByName("terminal64"))
            {
                using (proc)
                {
                    try
                    {
                        string? modulePath = proc.MainModule?.FileName;
                        if (string.IsNullOrEmpty(modulePath)) continue;

                        string fullModPath = Path.GetFullPath(modulePath);
                        // CRITICAL: ONLY stop processes inside .mt5-workers/ or legacy .mt5-worker/
                        // NEVER touch C:\Program Files\MetaTrader 5\terminal64.exe!
                        if (fullModPath.StartsWith(workersRootPrefix, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(fullModPath, legacyExePath, StringComparison.OrdinalIgnoreCase))
                        {
                            proc.Kill(entireProcessTree: true);
                            proc.WaitForExit(3000);
                        }
                    }
                    catch
                    {
                        // Ignore
                    }
                }
            }
        }
        catch
        {
            // Ignore
        }
    }

    public void Dispose()
    {
        StopWorkerProcessOnly();
    }
}
