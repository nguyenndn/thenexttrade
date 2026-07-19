import { describe, it, expect } from "vitest";
import {
    applyPrivacyPreset,
    sanitizePublicProfileData,
    canExposeSensitiveProfileField,
} from "./privacy-presets";

describe("privacy-presets", () => {
    describe("applyPrivacyPreset", () => {
        it("should return false for isPublicProfile under PRIVATE preset", () => {
            const res = applyPrivacyPreset("PRIVATE");
            expect(res.isPublicProfile).toBe(false);
        });

        it("should return correct fields under SAFE_PUBLIC preset", () => {
            const res = applyPrivacyPreset("SAFE_PUBLIC");
            expect(res.isPublicProfile).toBe(true);
            expect(res.showRealName).toBe(false);
            expect(res.showMoney).toBe(false);
            expect(res.showBroker).toBe(false);
            expect(res.showAccountNumber).toBe(false);
        });

        it("should return correct fields under FULL_PUBLIC preset", () => {
            const res = applyPrivacyPreset("FULL_PUBLIC");
            expect(res.isPublicProfile).toBe(true);
            expect(res.showRealName).toBe(true);
            expect(res.showMoney).toBe(true);
            expect(res.showBroker).toBe(true);
            expect(res.showAccountNumber).toBe(true);
        });
    });

    describe("sanitizePublicProfileData", () => {
        it("should return null if profile is not public", () => {
            const mockProfile = { isPublicProfile: false };
            expect(sanitizePublicProfileData(mockProfile)).toBeNull();
        });

        it("should redact money when showMoney is false", () => {
            const mockProfile = {
                isPublicProfile: true,
                showMoney: false,
                mainTradingAccount: {
                    balance: 5000,
                    equity: 4800,
                    broker: "Vantage",
                },
            };
            const sanitized = sanitizePublicProfileData(mockProfile);
            expect(sanitized.mainTradingAccount.balance).toBe(0);
            expect(sanitized.mainTradingAccount.equity).toBe(0);
        });

        it("should redact broker name when showBroker is false", () => {
            const mockProfile = {
                isPublicProfile: true,
                showBroker: false,
                mainTradingAccount: {
                    balance: 5000,
                    broker: "Vantage",
                    server: "Vantage-Live",
                },
            };
            const sanitized = sanitizePublicProfileData(mockProfile);
            expect(sanitized.mainTradingAccount.broker).toBeNull();
            expect(sanitized.mainTradingAccount.server).toBeNull();
        });
    });

    describe("canExposeSensitiveProfileField", () => {
        it("should return correct boolean for money exposure", () => {
            expect(
                canExposeSensitiveProfileField({ showMoney: true }, "money")
            ).toBe(true);
            expect(
                canExposeSensitiveProfileField({ showMoney: false }, "money")
            ).toBe(false);
        });
    });
});
