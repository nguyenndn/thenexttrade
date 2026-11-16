import { describe, it, expect, afterEach } from "vitest";
import {
    CANONICAL_MAIN_SERVER_URL,
    CANONICAL_BACKUP_SERVER_URLS,
    getSyncServerUrl,
    getMt5WebRequestServers,
} from "./sync-urls";

describe("sync-urls", () => {
    const origAppUrl = process.env.NEXT_PUBLIC_APP_URL;
    const origSyncUrl = process.env.NEXT_PUBLIC_SYNC_SERVER_URL;

    afterEach(() => {
        if (origAppUrl === undefined) {
            delete process.env.NEXT_PUBLIC_APP_URL;
        } else {
            process.env.NEXT_PUBLIC_APP_URL = origAppUrl;
        }
        if (origSyncUrl === undefined) {
            delete process.env.NEXT_PUBLIC_SYNC_SERVER_URL;
        } else {
            process.env.NEXT_PUBLIC_SYNC_SERVER_URL = origSyncUrl;
        }
    });

    it("never leaks http://localhost:3500 into MT5 WebRequest server URL", () => {
        process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3500";
        delete process.env.NEXT_PUBLIC_SYNC_SERVER_URL;

        expect(getSyncServerUrl("http://localhost:3500")).toBe(
            "https://thenexttrade.app"
        );
    });

    it("returns Main Server https://thenexttrade.app and both GitHub Backup Servers", () => {
        process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3500";
        const servers = getMt5WebRequestServers();

        expect(servers).toHaveLength(3);
        expect(servers[0]).toMatchObject({
            role: "MAIN",
            url: CANONICAL_MAIN_SERVER_URL,
        });
        expect(servers[1]).toMatchObject({
            role: "BACKUP",
            url: CANONICAL_BACKUP_SERVER_URLS[0],
        });
        expect(servers[2]).toMatchObject({
            role: "BACKUP",
            url: CANONICAL_BACKUP_SERVER_URLS[1],
        });
    });
});
