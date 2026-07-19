import { describe, expect, it } from "vitest";
import { buildGoogleUrl } from "./google";

describe("Google provider URL builder", () => {
    it("builds an endpoint from the Google origin", () => {
        expect(
            buildGoogleUrl(
                "https://generativelanguage.googleapis.com",
                "gemini-1.5-pro",
                "key+with/symbols"
            )
        ).toBe(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=key%2Bwith%2Fsymbols"
        );
    });

    it("fills model and secret placeholders safely", () => {
        expect(
            buildGoogleUrl(
                "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={secret}",
                "gemini test",
                "secret&next=bad"
            )
        ).toBe(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini%20test:generateContent?key=secret%26next%3Dbad"
        );
    });

    it("replaces a configured key instead of retaining a plaintext value", () => {
        expect(
            buildGoogleUrl(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini:generateContent?key=already-set",
                "ignored",
                "new-secret"
            )
        ).toContain("key=new-secret");
    });
});
