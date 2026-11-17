const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const MAX_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.MT5_SYNC_CONCURRENCY || '4', 10) || 4
);

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // Strict 7-day auto-expiry
const CACHE_SWEEP_INTERVAL_MS = 12 * 60 * 60 * 1000; // Periodic 12h sweep for idle servers
const DEFAULT_CACHE_ROOT_DIR = path.join(__dirname, 'trade-cache');
const MAX_CACHE_TOTAL_BYTES =
  Math.max(128, parseInt(process.env.MT5_TRADE_CACHE_MAX_MB || '1024', 10) || 1024) *
  1024 *
  1024; // Hard cap: 1 GB total across all cached accounts

/**
 * Process-wide 4-lane FIFO worker pool for Mt5NativeRunner (Unidbg ARM64 libcommon.so).
 * Guarantees:
 * 1. CONCURRENCY = 4 (configurable via MT5_SYNC_CONCURRENCY): Up to 4 Java processes run in parallel.
 * 2. Fixed slot isolation (`slot-1` .. `slot-4`): Concurrent runs never collide on `servers.dat` / `accounts.dat`.
 * 3. Bounded `.dat` Cache (`trade-cache/<server>__<login>`): Persists `symbols`, `groups`, `selected`, `deals_*`, & `history_*`
 *    so repeat syncs download only delta deals in seconds, bounded strictly by
 *    7-day TTL + 1 GB LRU cap, while `slot-N` temp files (`accounts.dat`, `spread`, `json`) are wiped immediately.
 */
if (!globalThis.__mt5NativeRunnerPool) {
  const freeSlots = [];
  for (let i = 1; i <= MAX_CONCURRENCY; i++) {
    freeSlots.push(i);
  }
  globalThis.__mt5NativeRunnerPool = {
    maxConcurrency: MAX_CONCURRENCY,
    freeSlots,
    activeCount: 0,
    waiters: []
  };
}

function acquireSlot() {
  const pool = globalThis.__mt5NativeRunnerPool;
  if (pool.freeSlots.length > 0) {
    const slotId = pool.freeSlots.shift();
    pool.activeCount += 1;
    return Promise.resolve(slotId);
  }
  return new Promise((resolve) => {
    pool.waiters.push(resolve);
  });
}

function releaseSlot(slotId) {
  const pool = globalThis.__mt5NativeRunnerPool;
  if (pool.waiters.length > 0) {
    const nextResolve = pool.waiters.shift();
    nextResolve(slotId);
  } else {
    pool.activeCount = Math.max(0, pool.activeCount - 1);
    pool.freeSlots.push(slotId);
    pool.freeSlots.sort((a, b) => a - b);
  }
}

function getNativeQueuePendingCount() {
  const pool = globalThis.__mt5NativeRunnerPool;
  return pool.activeCount + pool.waiters.length;
}

async function cleanWorkDir(targetDir) {
  if (!targetDir) return;
  try {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
  } catch {
    // Ignore transient file-handle release delays
  }
}

function getAccountCacheKey(serverName, login) {
  const cleanServer = String(serverName || 'default').replace(/[^a-zA-Z0-9._-]/g, '');
  const cleanLogin = String(login || '0').replace(/[^0-9]/g, '');
  return `${cleanServer}__${cleanLogin}`;
}

function isTradeDatFilename(filename) {
  return /^(deals|history)_\d{4}\.\d{2}\.dat$/i.test(filename);
}

function isServerBaseDatFilename(filename, login) {
  const cleanLogin = String(login || '0').replace(/[^0-9]/g, '');
  if (!cleanLogin) return false;
  const lower = String(filename || '').toLowerCase();
  return (
    lower === `symbols-${cleanLogin}.dat` ||
    lower === `groups-${cleanLogin}.dat` ||
    lower === `selected-${cleanLogin}.dat`
  );
}

function getBrokerEndpointCachePath(cacheRootDir, serverName, login) {
  return path.join(
    cacheRootDir,
    getAccountCacheKey(serverName, login),
    'broker-endpoint.json'
  );
}

async function isCacheDirExpired(cacheDir, now = Date.now()) {
  try {
    const markerPath = path.join(cacheDir, '.last_used');
    if (fs.existsSync(markerPath)) {
      const lastUsedMs = Number(await fs.promises.readFile(markerPath, 'utf8')) || 0;
      if (lastUsedMs > 0 && now - lastUsedMs > CACHE_TTL_MS) {
        return true;
      }
      if (lastUsedMs > 0) {
        return false;
      }
    }
    const st = await fs.promises.stat(cacheDir);
    return now - st.mtimeMs > CACHE_TTL_MS;
  } catch {
    return false;
  }
}

async function restoreAccountTradeCache(cacheRootDir, slotWorkDir, serverName, login) {
  try {
    await pruneAccountTradeCache(cacheRootDir);

    const cacheDir = path.join(cacheRootDir, getAccountCacheKey(serverName, login));
    if (!fs.existsSync(cacheDir)) return 0;

    if (await isCacheDirExpired(cacheDir)) {
      await cleanWorkDir(cacheDir);
      return 0;
    }

    const cleanServer = String(serverName || '').replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanLogin = String(login || '0').replace(/[^0-9]/g, '');
    const slotServerBaseDir = path.join(
      slotWorkDir,
      'rootfs',
      'data',
      'user',
      '0',
      'net.metaquotes.metatrader5',
      'files',
      'bases',
      cleanServer
    );
    const slotTradesDir = path.join(slotServerBaseDir, 'trades', cleanLogin);
    await fs.promises.mkdir(slotTradesDir, { recursive: true });

    const entries = await fs.promises.readdir(cacheDir);
    let copied = 0;
    for (const file of entries) {
      const srcPath = path.join(cacheDir, file);
      if (isTradeDatFilename(file)) {
        await fs.promises.copyFile(srcPath, path.join(slotTradesDir, file));
        copied++;
      } else if (isServerBaseDatFilename(file, cleanLogin)) {
        await fs.promises.copyFile(srcPath, path.join(slotServerBaseDir, file));
        copied++;
      }
    }
    return copied;
  } catch {
    return 0;
  }
}

async function persistAccountTradeCache(cacheRootDir, slotWorkDir, serverName, login) {
  try {
    const cleanServer = String(serverName || '').replace(/[^a-zA-Z0-9._-]/g, '');
    const cleanLogin = String(login || '0').replace(/[^0-9]/g, '');
    const slotServerBaseDir = path.join(
      slotWorkDir,
      'rootfs',
      'data',
      'user',
      '0',
      'net.metaquotes.metatrader5',
      'files',
      'bases',
      cleanServer
    );
    if (!fs.existsSync(slotServerBaseDir)) return;

    const slotTradesDir = path.join(slotServerBaseDir, 'trades', cleanLogin);
    const tradeDatFiles = fs.existsSync(slotTradesDir)
      ? (await fs.promises.readdir(slotTradesDir)).filter(isTradeDatFilename)
      : [];
    const serverDatFiles = (await fs.promises.readdir(slotServerBaseDir)).filter((f) =>
      isServerBaseDatFilename(f, cleanLogin)
    );

    if (tradeDatFiles.length === 0 && serverDatFiles.length === 0) return;

    const cacheDir = path.join(cacheRootDir, getAccountCacheKey(serverName, login));
    await fs.promises.mkdir(cacheDir, { recursive: true });

    for (const file of tradeDatFiles) {
      await fs.promises.copyFile(path.join(slotTradesDir, file), path.join(cacheDir, file));
    }
    for (const file of serverDatFiles) {
      await fs.promises.copyFile(path.join(slotServerBaseDir, file), path.join(cacheDir, file));
    }
    await fs.promises.writeFile(path.join(cacheDir, '.last_used'), String(Date.now()), 'utf8');

    await pruneAccountTradeCache(cacheRootDir);
  } catch {
    // Non-fatal cache write failure
  }
}

async function pruneAccountTradeCache(cacheRootDir) {
  try {
    if (!fs.existsSync(cacheRootDir)) return;
    const now = Date.now();
    const accountDirs = await fs.promises.readdir(cacheRootDir, { withFileTypes: true });
    const statsList = [];

    for (const dirent of accountDirs) {
      if (!dirent.isDirectory()) continue;
      const fullDir = path.join(cacheRootDir, dirent.name);
      let lastUsedMs = 0;
      let dirBytes = 0;

      try {
        const markerPath = path.join(fullDir, '.last_used');
        if (fs.existsSync(markerPath)) {
          lastUsedMs = Number(await fs.promises.readFile(markerPath, 'utf8')) || 0;
        }
        const files = await fs.promises.readdir(fullDir);
        for (const f of files) {
          const st = await fs.promises.stat(path.join(fullDir, f));
          dirBytes += st.size;
          if (!lastUsedMs && st.mtimeMs > lastUsedMs) {
            lastUsedMs = st.mtimeMs;
          }
        }
      } catch {
        continue;
      }

      // 1. TTL eviction: remove accounts inactive > 7 days
      if (lastUsedMs > 0 && now - lastUsedMs > CACHE_TTL_MS) {
        await cleanWorkDir(fullDir);
        continue;
      }

      statsList.push({ fullDir, lastUsedMs, dirBytes });
    }

    // 2. Hard size cap eviction (LRU — oldest used evicted first if total > 1 GB)
    let totalBytes = statsList.reduce((acc, item) => acc + item.dirBytes, 0);
    if (totalBytes > MAX_CACHE_TOTAL_BYTES) {
      statsList.sort((a, b) => a.lastUsedMs - b.lastUsedMs);
      for (const item of statsList) {
        if (totalBytes <= MAX_CACHE_TOTAL_BYTES) break;
        await cleanWorkDir(item.fullDir);
        totalBytes -= item.dirBytes;
      }
    }
  } catch {
    // Non-fatal cache prune failure
  }
}

async function enqueueNativeRun(baseWorkDir, taskFn) {
  const slotId = await acquireSlot();
  const slotWorkDir = path.join(baseWorkDir, `slot-${slotId}`);
  try {
    await cleanWorkDir(slotWorkDir);
    return await taskFn(slotWorkDir, slotId);
  } finally {
    await cleanWorkDir(slotWorkDir);
    releaseSlot(slotId);
    const pool = globalThis.__mt5NativeRunnerPool;
    if (pool.activeCount === 0 && pool.waiters.length === 0) {
      await cleanWorkDir(baseWorkDir);
    }
  }
}

function execJavaAsync(javaExe, args, options = {}) {
  const defaultHeap = process.env.MT5_JAVA_HEAP || '-Xmx768m';
  const finalArgs = args[0] && String(args[0]).startsWith('-Xmx') ? args : [defaultHeap, ...args];
  return new Promise((resolve, reject) => {
    execFile(
      javaExe,
      finalArgs,
      {
        encoding: 'utf8',
        maxBuffer: 128 * 1024 * 1024,
        timeout: 600000,
        windowsHide: true,
        ...options
      },
      (err, stdout) => {
        if (err) {
          if (err.killed || err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
            reject(
              new Error(
                'Connection to MT5 server timed out while loading trade history. Please try a shorter date range or try again.'
              )
            );
            return;
          }
          reject(
            new Error(
              'Unable to load trade history from MT5 server. Please verify your server and credentials or try again.'
            )
          );
          return;
        }
        resolve(stdout);
      }
    );
  });
}

if (!globalThis.__mt5TradeCacheSweepTimer) {
  const sweepTimer = setInterval(() => {
    void pruneAccountTradeCache(DEFAULT_CACHE_ROOT_DIR);
  }, CACHE_SWEEP_INTERVAL_MS);
  if (typeof sweepTimer.unref === 'function') {
    sweepTimer.unref();
  }
  globalThis.__mt5TradeCacheSweepTimer = sweepTimer;
  void pruneAccountTradeCache(DEFAULT_CACHE_ROOT_DIR);
}

module.exports = {
  MAX_CONCURRENCY,
  CACHE_TTL_MS,
  MAX_CACHE_TOTAL_BYTES,
  enqueueNativeRun,
  getNativeQueuePendingCount,
  cleanWorkDir,
  getAccountCacheKey,
  getBrokerEndpointCachePath,
  restoreAccountTradeCache,
  persistAccountTradeCache,
  pruneAccountTradeCache,
  execJavaAsync
};
