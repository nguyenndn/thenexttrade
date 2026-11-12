const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const MAX_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.MT5_SYNC_CONCURRENCY || '4', 10) || 4
);

/**
 * Process-wide 4-lane FIFO worker pool for Mt5NativeRunner (Unidbg ARM64 libcommon.so).
 * Guarantees:
 * 1. CONCURRENCY = 4 (configurable via MT5_SYNC_CONCURRENCY): Up to 4 Java processes run in parallel.
 * 2. Fixed slot isolation (`slot-1` .. `slot-4`): Concurrent runs never collide on `servers.dat` / `accounts.dat`.
 * 3. Automatic cleanup: Each `slot-N` directory is wiped immediately after finishing, and parent `unidbg-workdir`
 *    is removed when all lanes are idle (0 MB disk bloat, zero leftover subfolders).
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
  const finalArgs = args[0] && String(args[0]).startsWith('-Xmx') ? args : ['-Xmx256m', ...args];
  return new Promise((resolve, reject) => {
    execFile(
      javaExe,
      finalArgs,
      {
        encoding: 'utf8',
        maxBuffer: 128 * 1024 * 1024,
        timeout: 120000,
        windowsHide: true,
        ...options
      },
      (err, stdout, stderr) => {
        if (err) {
          const detail = stderr ? `${err.message} (${String(stderr).slice(0, 300)})` : err.message;
          reject(new Error(detail));
          return;
        }
        resolve(stdout);
      }
    );
  });
}

module.exports = {
  MAX_CONCURRENCY,
  enqueueNativeRun,
  getNativeQueuePendingCount,
  cleanWorkDir,
  execJavaAsync
};
