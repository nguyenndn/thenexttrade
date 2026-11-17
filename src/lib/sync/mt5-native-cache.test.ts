import fs from "fs";
import os from "os";
import path from "path";
import { createRequire } from "module";
import { describe, it, expect, afterEach } from "vitest";

const requireCjs = createRequire(import.meta.url);

interface NativeQueueModule {
    CACHE_TTL_MS: number;
    MAX_CACHE_TOTAL_BYTES: number;
    getAccountCacheKey: (serverName: string, login: string | number) => string;
    getBrokerEndpointCachePath: (
        cacheRootDir: string,
        serverName: string,
        login: string | number
    ) => string;
    restoreAccountTradeCache: (
        cacheRootDir: string,
        slotWorkDir: string,
        serverName: string,
        login: string | number
    ) => Promise<number>;
    persistAccountTradeCache: (
        cacheRootDir: string,
        slotWorkDir: string,
        serverName: string,
        login: string | number
    ) => Promise<void>;
    pruneAccountTradeCache: (cacheRootDir: string) => Promise<void>;
}

const nativeQueue = requireCjs(
    path.join(process.cwd(), "mt5-cloud-sync", "NativeQueue.js")
) as NativeQueueModule;

describe("mt5-cloud-sync NativeQueue 7-day symbol & trade cache", () => {
    const tempDirs: string[] = [];

    const makeTempDir = async (prefix: string): Promise<string> => {
        const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), prefix));
        tempDirs.push(dir);
        return dir;
    };

    afterEach(async () => {
        while (tempDirs.length > 0) {
            const dir = tempDirs.pop();
            if (dir) {
                await fs.promises.rm(dir, { recursive: true, force: true });
            }
        }
    });

    it("enforces an exact 7-day CACHE_TTL_MS and 1 GB MAX_CACHE_TOTAL_BYTES cap", () => {
        expect(nativeQueue.CACHE_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
        expect(nativeQueue.MAX_CACHE_TOTAL_BYTES).toBe(1024 * 1024 * 1024);
    });

    it("persists and restores symbols, groups, selected, deals, and history .dat files within 7 days", async () => {
        const cacheRoot = await makeTempDir("mt5-cache-root-");
        const slot1 = await makeTempDir("mt5-slot-1-");
        const slot2 = await makeTempDir("mt5-slot-2-");

        const serverName = "UltimaMarkets-Demo";
        const login = "924399";
        const serverBase1 = path.join(
            slot1,
            "rootfs",
            "data",
            "user",
            "0",
            "net.metaquotes.metatrader5",
            "files",
            "bases",
            serverName
        );
        const tradesDir1 = path.join(serverBase1, "trades", login);
        await fs.promises.mkdir(tradesDir1, { recursive: true });

        await fs.promises.writeFile(
            path.join(serverBase1, `symbols-${login}.dat`),
            "SYMBOLS_BIN"
        );
        await fs.promises.writeFile(
            path.join(serverBase1, `groups-${login}.dat`),
            "GROUPS_BIN"
        );
        await fs.promises.writeFile(
            path.join(serverBase1, `selected-${login}.dat`),
            "SELECTED_BIN"
        );
        await fs.promises.writeFile(
            path.join(tradesDir1, "deals_2026.11.dat"),
            "DEALS_BIN"
        );
        await fs.promises.writeFile(
            path.join(tradesDir1, "history_2026.11.dat"),
            "HISTORY_BIN"
        );

        await nativeQueue.persistAccountTradeCache(
            cacheRoot,
            slot1,
            serverName,
            login
        );

        const brokerCachePath = nativeQueue.getBrokerEndpointCachePath(
            cacheRoot,
            serverName,
            login
        );
        await fs.promises.writeFile(
            brokerCachePath,
            JSON.stringify({ serverName, access: ["1.2.3.4:443"] })
        );

        const copiedCount = await nativeQueue.restoreAccountTradeCache(
            cacheRoot,
            slot2,
            serverName,
            login
        );
        expect(copiedCount).toBe(5);

        const serverBase2 = path.join(
            slot2,
            "rootfs",
            "data",
            "user",
            "0",
            "net.metaquotes.metatrader5",
            "files",
            "bases",
            serverName
        );
        expect(
            await fs.promises.readFile(
                path.join(serverBase2, `symbols-${login}.dat`),
                "utf8"
            )
        ).toBe("SYMBOLS_BIN");
        expect(
            await fs.promises.readFile(
                path.join(serverBase2, `groups-${login}.dat`),
                "utf8"
            )
        ).toBe("GROUPS_BIN");
        expect(
            await fs.promises.readFile(
                path.join(serverBase2, `selected-${login}.dat`),
                "utf8"
            )
        ).toBe("SELECTED_BIN");
        expect(
            await fs.promises.readFile(
                path.join(serverBase2, "trades", login, "deals_2026.11.dat"),
                "utf8"
            )
        ).toBe("DEALS_BIN");
        expect(
            await fs.promises.readFile(
                path.join(serverBase2, "trades", login, "history_2026.11.dat"),
                "utf8"
            )
        ).toBe("HISTORY_BIN");
    });

    it("automatically deletes all cached account files and broker endpoints older than 7 days", async () => {
        const cacheRoot = await makeTempDir("mt5-cache-expire-");
        const slot = await makeTempDir("mt5-slot-expire-");

        const serverName = "UltimaMarkets-Demo";
        const login = "924399";
        const accountCacheDir = path.join(
            cacheRoot,
            nativeQueue.getAccountCacheKey(serverName, login)
        );
        await fs.promises.mkdir(accountCacheDir, { recursive: true });

        await fs.promises.writeFile(
            path.join(accountCacheDir, `symbols-${login}.dat`),
            "OLD_SYMBOLS"
        );
        await fs.promises.writeFile(
            path.join(accountCacheDir, "deals_2026.11.dat"),
            "OLD_DEALS"
        );
        await fs.promises.writeFile(
            path.join(accountCacheDir, "broker-endpoint.json"),
            "{}"
        );

        // Stamp .last_used to 7 days + 1 minute ago
        const expiredTimestamp =
            Date.now() - (nativeQueue.CACHE_TTL_MS + 60_000);
        await fs.promises.writeFile(
            path.join(accountCacheDir, ".last_used"),
            String(expiredTimestamp),
            "utf8"
        );

        const restoredCount = await nativeQueue.restoreAccountTradeCache(
            cacheRoot,
            slot,
            serverName,
            login
        );
        expect(restoredCount).toBe(0);
        expect(fs.existsSync(accountCacheDir)).toBe(false);
    });
});
