import { describe, it, expect } from "vitest";
import {
    getEmailPreferences,
    canSendEmailCategory,
    DEFAULT_EMAIL_PREFERENCES,
} from "./preferences";

describe("email preferences", () => {
    it("defaults to everything-on when settings are missing", () => {
        expect(getEmailPreferences(undefined)).toEqual(
            DEFAULT_EMAIL_PREFERENCES
        );
        expect(getEmailPreferences(null)).toEqual(DEFAULT_EMAIL_PREFERENCES);
        expect(getEmailPreferences({})).toEqual(DEFAULT_EMAIL_PREFERENCES);
    });

    it("reads stored booleans and ignores malformed values", () => {
        const prefs = getEmailPreferences({
            emailPreferences: {
                reports: false,
                activation: true,
                marketing: "nope", // invalid → fall back to default
                unsubscribedAll: true,
            },
        });
        expect(prefs.reports).toBe(false);
        expect(prefs.activation).toBe(true);
        expect(prefs.marketing).toBe(true); // default preserved
        expect(prefs.unsubscribedAll).toBe(true);
    });

    it("treats a non-object emailPreferences as absent", () => {
        expect(getEmailPreferences({ emailPreferences: "yes" })).toEqual(
            DEFAULT_EMAIL_PREFERENCES
        );
        expect(getEmailPreferences({ emailPreferences: 42 })).toEqual(
            DEFAULT_EMAIL_PREFERENCES
        );
    });

    it("canSendEmailCategory respects each category toggle", () => {
        expect(
            canSendEmailCategory({ emailPreferences: { reports: false } }, "reports")
        ).toBe(false);
        expect(
            canSendEmailCategory({ emailPreferences: { reports: true } }, "reports")
        ).toBe(true);
        expect(
            canSendEmailCategory({ emailPreferences: { reports: false } }, "activation")
        ).toBe(true); // unrelated category untouched
    });

    it("unsubscribedAll overrides every category", () => {
        const settings = {
            emailPreferences: {
                reports: true,
                activation: true,
                marketing: true,
                welcome: true,
                unsubscribedAll: true,
            },
        };
        expect(canSendEmailCategory(settings, "reports")).toBe(false);
        expect(canSendEmailCategory(settings, "activation")).toBe(false);
        expect(canSendEmailCategory(settings, "welcome")).toBe(false);
    });
});
