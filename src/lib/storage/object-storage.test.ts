import { describe, it, expect } from "vitest";
import {
    resolveStorageDirectory,
    canDeleteAssetKeyInEnv,
} from "./object-storage";

describe("object-storage environment namespace isolation", () => {
    describe("resolveStorageDirectory", () => {
        it("prefixes directories with dev/ when running in development", () => {
            expect(resolveStorageDirectory("avatars", "development")).toBe(
                "dev/avatars"
            );
            expect(resolveStorageDirectory("journal", "development")).toBe(
                "dev/journal"
            );
            expect(resolveStorageDirectory("uploads", "development")).toBe(
                "dev/uploads"
            );
            expect(
                resolveStorageDirectory("/avatars/", "development")
            ).toBe("dev/avatars");
        });

        it("is idempotent when directory already starts with dev/ in development", () => {
            expect(resolveStorageDirectory("dev/avatars", "development")).toBe(
                "dev/avatars"
            );
        });

        it("keeps production directories unprefixed", () => {
            expect(resolveStorageDirectory("avatars", "production")).toBe(
                "avatars"
            );
            expect(resolveStorageDirectory("journal", "production")).toBe(
                "journal"
            );
            expect(resolveStorageDirectory("uploads", "production")).toBe(
                "uploads"
            );
            expect(resolveStorageDirectory("/avatars/", "production")).toBe(
                "avatars"
            );
        });
    });

    describe("canDeleteAssetKeyInEnv", () => {
        it("blocks local development from deleting production R2 keys", () => {
            expect(
                canDeleteAssetKeyInEnv(
                    "avatars/av-fad5fc63-92e7-4af1-aec2-23f957da0db2.webp",
                    "development"
                )
            ).toBe(false);
            expect(
                canDeleteAssetKeyInEnv(
                    "journal/chart-123.webp",
                    "development"
                )
            ).toBe(false);
        });

        it("allows local development to delete its own dev/ R2 keys", () => {
            expect(
                canDeleteAssetKeyInEnv(
                    "dev/avatars/av-123.webp",
                    "development"
                )
            ).toBe(true);
            expect(
                canDeleteAssetKeyInEnv(
                    "/dev/journal/chart-123.webp",
                    "development"
                )
            ).toBe(true);
        });

        it("allows production to delete production keys while protecting dev/ and mt5/ keys", () => {
            expect(
                canDeleteAssetKeyInEnv(
                    "avatars/av-fad5fc63-92e7-4af1-aec2-23f957da0db2.webp",
                    "production"
                )
            ).toBe(true);
            expect(
                canDeleteAssetKeyInEnv(
                    "dev/avatars/av-123.webp",
                    "production"
                )
            ).toBe(false);
            expect(
                canDeleteAssetKeyInEnv("mt5/installer.ex5", "production")
            ).toBe(false);
            expect(
                canDeleteAssetKeyInEnv("dev/../avatars/av.webp", "development")
            ).toBe(false);
            expect(canDeleteAssetKeyInEnv("", "production")).toBe(false);
        });
    });
});
