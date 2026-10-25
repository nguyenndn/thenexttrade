#!/usr/bin/env node
/**
 * Smart launcher for the C# .NET 8 MT5 Direct Bridge service.
 * Automatically frees port 5055 if an older mt5-bridge instance is already running,
 * preventing "System.IO.IOException: Failed to bind to address http://127.0.0.1:5055: address already in use".
 */
const { execSync, spawn } = require("child_process");
const path = require("path");

const PORT = process.env.MT5_BRIDGE_PORT || "5055";
const isWin = process.platform === "win32";

function freePort(port) {
    try {
        if (isWin) {
            const out = execSync(`netstat -ano | findstr :${port}`, {
                encoding: "utf8",
                stdio: ["ignore", "pipe", "ignore"],
            });
            const pids = new Set();
            for (const line of out.split(/\r?\n/)) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.includes("LISTENING")) continue;
                const parts = trimmed.split(/\s+/);
                const pid = parts[parts.length - 1];
                if (pid && /^\d+$/.test(pid) && pid !== "0" && Number(pid) !== process.pid) {
                    pids.add(pid);
                }
            }
            for (const pid of pids) {
                console.log(`[mt5-bridge] Stopping existing process on port ${port} (PID ${pid})...`);
                try {
                    execSync(`taskkill /F /PID ${pid}`, { stdio: "ignore" });
                } catch {
                    // Ignore if already exited
                }
            }
        } else {
            try {
                execSync(`fuser -k ${port}/tcp`, { stdio: "ignore" });
            } catch {
                // Ignore if fuser not installed or no process on port
            }
        }
    } catch {
        // Port is already free
    }
}

function stopIsolatedWorkerProcess() {
    if (!isWin) return;
    try {
        // ONLY stop terminal64.exe whose executable path is inside .mt5-workers or legacy .mt5-worker (NEVER touch C:\Program Files\MetaTrader 5\terminal64.exe)
        const psCmd =
            "Get-CimInstance Win32_Process -Filter \"Name='terminal64.exe'\" | Where-Object { $_.ExecutablePath -like '*.mt5-worker*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";
        execSync(`powershell -NoProfile -Command "${psCmd}"`, { stdio: "ignore" });
    } catch {
        // Ignore
    }
}

freePort(PORT);

const projectPath = path.join(process.cwd(), "mt5-bridge", "mt5-bridge.csproj");
console.log(`[mt5-bridge] Starting Direct MT5 Socket Bridge on http://127.0.0.1:${PORT}...`);

const child = spawn(
    "dotnet",
    ["run", "--project", projectPath, "--urls", `http://127.0.0.1:${PORT}`],
    {
        stdio: "inherit",
        shell: false,
    }
);

let shuttingDown = false;
function handleShutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\n[mt5-bridge] Stopping bridge and isolated background worker (${signal})...`);
    try {
        child.kill("SIGINT");
    } catch {
        // Ignore
    }
    stopIsolatedWorkerProcess();
    process.exit(0);
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGHUP", () => handleShutdown("SIGHUP"));

child.on("exit", (code) => {
    stopIsolatedWorkerProcess();
    process.exit(code ?? 0);
});
