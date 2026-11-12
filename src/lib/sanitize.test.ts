import { describe, expect, it } from "vitest";
import { htmlToPlainText } from "./sanitize";

describe("htmlToPlainText", () => {
    it("returns empty string for nullish input", () => {
        expect(htmlToPlainText(null)).toBe("");
        expect(htmlToPlainText(undefined)).toBe("");
        expect(htmlToPlainText("")).toBe("");
    });

    it("strips paragraph tags from rich text editor output", () => {
        expect(htmlToPlainText("<p>GSN SNR System</p>")).toBe("GSN SNR System");
    });

    it("keeps word boundaries between block elements and line breaks", () => {
        expect(
            htmlToPlainText("<p>Line one</p><p>Line <strong>two</strong><br/>three</p>")
        ).toBe("Line one Line two three");
    });

    it("decodes common HTML entities", () => {
        expect(htmlToPlainText("<p>Risk&nbsp;&amp;&nbsp;Reward &lt;1:2&gt; &#39;SL&#x27;</p>")).toBe(
            "Risk & Reward <1:2> 'SL'"
        );
    });

    it("drops script and style contents entirely", () => {
        expect(
            htmlToPlainText("<p>Safe</p><script>alert(1)</script><style>p{}</style>")
        ).toBe("Safe");
    });

    it("leaves plain text untouched", () => {
        expect(htmlToPlainText("Plain description")).toBe("Plain description");
    });
});

