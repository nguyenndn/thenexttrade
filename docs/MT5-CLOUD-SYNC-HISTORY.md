# MT5 Cloud Sync — History Logic, Cold Start & Telemetry

How the in-process MT5 Cloud Sync (`mt5-cloud-sync/`) loads trade history, why a cold account can be
slow even when the user picks **Today**, and how to read its logs and tune its limits.

> Related code: `mt5-cloud-sync/CloudSyncService.js`, `mt5-cloud-sync/apk/terminal/TradesBase.js`,
> `mt5-cloud-sync/NativeQueue.js`, `mt5-cloud-sync/unidbg-runner/src/main/java/com/gsn/mt5/Mt5NativeRunner.java`,
> `src/actions/cloud-sync.ts`.

---

## 1. What a sync actually asks the broker

The CRM passes a `period` and an explicit `[from, to]` range. The native runner resolves the range
against the **live broker clock** (`TradeTime.timeZone` / `TradeTime.tradeTime` from `libcommon.so`),
not the server clock, then issues exactly one history request for that range.

| `period` | Resolved range (broker time) |
|---|---|
| `1` / `today` | `00:00:00 → 23:59:59.999` of the current broker day |
| `N` (`N > 1`) | start of broker today − `N` days → end of broker today |
| `all` | requested fallback range, expanded to cover broker today |
| `custom` / empty | the fallback `[from, to]` sent by the CRM |

Request issued to the terminal: `tradeHistoryPeriod(0, fromMs, toMs)` and `(1, fromMs, toMs)`.
Output is then **filtered to the same range** while it is streamed to JSON. Nothing in the sync code
asks the broker for the account's full history.

The Cloud Sync modal in `/dashboard/accounts` defaults to **Today** (`period = "1"`); longer windows
(3/7/30/90/180 days, all, custom) are opt-in and widen the number of monthly `.dat` files touched.

### So why does "Today" still need a warm cache?

The terminal does not answer from an API — it answers from its binary `.dat` base:

- `deals_YYYY.MM.dat`, `history_YYYY.MM.dat` — **one file per month**, not per day.
- `symbols-<login>.dat`, `groups-<login>.dat`, `selected-<login>.dat`.
- `broker-endpoint.json` — resolved access points / CDN endpoint (7-day TTL).

A "Today" request needs the **current month's** file (and may need the **previous month** when a
position closed today was opened earlier — the terminal has to read its opening deal). On a cold
account, the terminal also has to finish the login-time account snapshot (`stateB540 == 4`) before it
accepts any history request.

Consequence: "Today" is a small **answer**, but a cold account still pays the cost of rebuilding the
**base** that the answer is computed from.

---

## 2. Job lifecycle and error codes

| Stage | `progressPercent` | Message |
|---|---|---|
| Queued | 10 | Queued for sync… |
| Connecting & loading | 25 | Connecting & loading trade history… |
| First sync (cold account) | 25 | First-time sync: preparing trade history base (may take a few minutes)… |
| Auto-retry | 30 | MT5 server was slow. Retrying sync (2/2)… |
| Done | 100 | summary |

| `errorCode` | Meaning | Retried automatically? |
|---|---|---|
| `AUTH_FAILED` | Login rejected / could not authenticate | No |
| `TERMINAL_NOT_READY` | Authenticated, but the terminal never finished syncing the account | Yes (warm only) |
| `HISTORY_TIMEOUT` | History request issued, response never completed in budget | Yes (warm only) |
| `RUNNER_FAILED` | JVM exited non-zero (not a timeout) | Yes (warm only) |
| `SYNC_FAILED` | Native runner returned `success:false` without a known code | No |
| `AUTH_OR_SYNC_FAILED` | Legacy fallback when no code is available | No |
| `SYNC_EXECUTION_ERROR` | Unexpected exception inside the server action | No |
| `JOB_TIMEOUT` / `USER_CANCELLED` | Stale job / user cancelled | No |

The UI renders these through `formatSyncErrorMessage()` (`src/lib/sync/sync-source.ts`).
`HISTORY_TIMEOUT` and `TERMINAL_NOT_READY` messages are shown verbatim because they are crafted
server-side with no internal jargon.

---

## 3. Timeouts — warm vs first sync

`TradesBase` treats an account as **first sync** when its cache folder has no usable `.dat` file
(`hasWarmTradeCache()` in `NativeQueue.js`). It then passes `--first-sync` to the runner.

| Limit | Warm sync | First sync | Env override |
|---|---|---|---|
| TCP connect (per access point) | 8 s | 8 s | `MT5_CONNECT_TIMEOUT_MS` |
| Auth allowed | 15 s | 15 s | — |
| Terminal ready after auth | 120 s | 120 s | `MT5_TERMINAL_READY_TIMEOUT_MS` |
| History request → response | 420 s | 600 s | `MT5_HISTORY_TIMEOUT_MS` / `MT5_FIRST_SYNC_HISTORY_TIMEOUT_MS` |
| Whole pump | 540 s | 900 s | `MT5_PUMP_TIMEOUT_MS` / `MT5_FIRST_SYNC_PUMP_TIMEOUT_MS` |
| Pump step budget | 4 000 | 12 000 | — |
| Node `execFile` timeout | 600 s | 900 s | — |

The pump/job ceilings are always lower than the Node timeout so the runner can return a structured
`errorCode` JSON instead of being killed with `SIGTERM`.

---

## 4. Trade cache

- Default location: `mt5-cloud-sync/trade-cache/<server>__<login>/`.
- Override with `MT5_TRADE_CACHE_DIR` (Docker image sets it to `/app/mt5-cloud-sync/trade-cache`).
- Eviction: 7 days without use, or LRU when the total exceeds `MT5_TRADE_CACHE_MAX_MB` (default 1024).
- The cache is written **even when a sync fails**, so the next attempt reads the partially built base.
- In production, mount a **persistent volume** at the cache directory — otherwise every redeploy
  makes every account cold again. See `docs/OPERATIONS.md` → "MT5 Cloud Sync trade cache".

---

## 5. Retry policy

- Triggered only for `HISTORY_TIMEOUT`, `TERMINAL_NOT_READY`, `RUNNER_FAILED`.
- Waits 2 s, updates the job to `progress 30` with "Retrying sync (2/2)…", then runs once more.
- **Skipped for first syncs**: those already ran with the enlarged budget, so a retry would only
  double the user's wait.
- The second attempt reuses whatever `.dat` files the first attempt persisted — normally warm.

---

## 6. Telemetry — how to read the runner logs

Two extra log families were added to `Mt5NativeRunner`. They are the fastest way to tell a real
download apart from a stalled connection.

**Every 5 s while pumping:**

```
[Net] step=1820 recvKB=15360 sendKB=64 idleMs=120 authorized=true historyRequested=true
```

| Field | Meaning |
|---|---|
| `recvKB` / `sendKB` | Cumulative bytes since the JVM started |
| `idleMs` | Time since the last byte in either direction |
| `authorized` | Login succeeded |
| `historyRequested` | `tradeHistoryPeriod` was accepted by the terminal |

**Once, at the end (success or failure):**

```
[Telemetry] completed=false firstSync=true elapsedMs=512000 authToReadyMs=48000 requestToDoneMs=600000 recvKB=412000 sendKB=2048 lastNetIdleMs=240
```

| Observation | Likely cause | Action |
|---|---|---|
| `recvKB` climbs steadily, `idleMs` small, no completion | Terminal is downloading the monthly base | Expected on first sync; check volume is mounted so it happens once |
| `recvKB` flat, `idleMs` large | Endpoint / broker stall | Check `[Socket] Connect failed` lines, access-point rotation, broker endpoint cache |
| `authorized=false` and idle | Auth or DNS problem | Verify server name, login, password, access points |
| `historyRequested=false`, `authorized=true` | Terminal stuck before accepting the history request | Likely account snapshot / symbols base; first-sync budget should cover it |
| `authToReadyMs` near the 120 s ceiling | Slow account snapshot | Consider raising `MT5_TERMINAL_READY_TIMEOUT_MS` |
| `requestToDoneMs` near the history ceiling, bytes climbing | Base larger than budget | First sync → raise `MT5_FIRST_SYNC_HISTORY_TIMEOUT_MS` |

`TradesBase` re-logs the runner's own stage lines into the Node process log — a bounded tail on
failure, and one compact line on success:

```
[MT5NativeRunner] sync failed server=... login=... code=HISTORY_TIMEOUT message=...
--- stdout stages ---
... (tail)
```

```
[MT5NativeRunner] sync ok server=... login=... firstSync=false [Pump] Mode: WARM historyTimeoutMs=420000 pumpTimeoutMs=540000 maxSteps=4000 [Telemetry] completed=true firstSync=false elapsedMs=... authToReadyMs=... requestToDoneMs=... recvKB=... sendKB=... lastNetIdleMs=...
```

On success the raw `[Net]` stream is not emitted (stdout is captured by `execFile`); the single
`sync ok` line carries the mode and the phase timings needed to tell a slow download from a stalled
connection. This is the line to grep in container logs when a job takes far longer than the ~20 s
warm baseline.

The diagnostic modal in `/admin/cloud-sync-logs` (eye icon on a row) has a **Copy JSON** button that
copies the whole job record — mode, range, progress, `dealsReceived`, `errorCode`, `errorMessage` —
which is what to attach to a bug report. Note it holds the job summary only; runner timings live in
the container log line above.

---

## 7. Environment variables

```env
# Cache
MT5_TRADE_CACHE_DIR=/app/mt5-cloud-sync/trade-cache
MT5_TRADE_CACHE_MAX_MB=1024

# Concurrency (native runner lanes)
MT5_SYNC_CONCURRENCY=4

# Runner budgets (warm)
MT5_CONNECT_TIMEOUT_MS=8000
MT5_TERMINAL_READY_TIMEOUT_MS=120000
MT5_HISTORY_TIMEOUT_MS=420000
MT5_PUMP_TIMEOUT_MS=540000

# Runner budgets (first sync)
MT5_FIRST_SYNC_HISTORY_TIMEOUT_MS=600000
MT5_FIRST_SYNC_PUMP_TIMEOUT_MS=900000

# Runtime
MT5_JAVA_HEAP=-Xmx768m
MT5_APK_PATH=/app/mt5-cloud-sync/bin/metatrader5.apk
MT5_VERBOSE_TRACE=0
```

---

## 8. Invariants — do not break these

1. Never request a range wider than the user selected; the terminal cost scales with months touched.
2. Never let the Node `execFile` timeout be shorter than the runner pump timeout — the runner must
   always be able to emit its own `errorCode`.
3. Never delete cache files on failure; a partial base is what makes the retry fast.
4. Never retry a first-sync failure automatically; the first-sync budget already covers the cold case.
5. Keep the volume mount owned by uid `1001` (`nextjs`), otherwise cache writes silently fail.
