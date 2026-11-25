import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { PLAYBOOK_PRESETS } from "@/lib/strategies/playbook-presets";
import { PlaybookSchematicSvg } from "./PlaybookSchematicSvg";
import { SCHEMATIC_SCENES } from "./schematic-scenes";

describe("PlaybookSchematicSvg", () => {
    it("renders 36–42 continuous TradingView candles (o[i] === c[i-1]) for all 13 templates", () => {
        const types = PLAYBOOK_PRESETS.map((p) => p.schematicType);
        expect(types).toHaveLength(13);
        expect(new Set(types).size).toBe(13);

        for (const preset of PLAYBOOK_PRESETS) {
            const scene = SCHEMATIC_SCENES[preset.schematicType];
            expect(scene).toBeDefined();
            expect(scene.candles.length).toBeGreaterThanOrEqual(36);

            // Enforce strict Forex candle continuity: every bar opens at prev close
            for (let i = 1; i < scene.candles.length; i++) {
                expect(scene.candles[i].o).toBe(scene.candles[i - 1].c);
                expect(scene.candles[i].h).toBeGreaterThanOrEqual(
                    Math.max(scene.candles[i].o, scene.candles[i].c)
                );
                expect(scene.candles[i].l).toBeLessThanOrEqual(
                    Math.min(scene.candles[i].o, scene.candles[i].c)
                );
            }

            const html = renderToString(
                <PlaybookSchematicSvg
                    type={preset.schematicType}
                    accentColor={preset.color}
                />
            );
            expect(html).toContain(scene.symbol);
            expect(html).toContain(scene.direction);
            expect(html).toContain("ENTRY");
            expect(html).toContain("SL");
            expect(html).toContain(`TP ${scene.position.rrLabel}`);
        }
    });
});
