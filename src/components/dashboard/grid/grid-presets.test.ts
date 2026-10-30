import { describe, it, expect } from "vitest";
import {
    buildPresetLayout,
    PRESET_DEFINITIONS,
    GridPresetId,
    PresetDefinition,
} from "./grid-presets";
import { WIDGET_REGISTRY, WidgetType } from "./WidgetRegistry";
import { LayoutItem } from "./WidgetGrid";

const ALL_12_PRESET_IDS: GridPresetId[] = [
    "command-center",
    "executive-bento",
    "analytics-wall",
    "hero-split",
    "triple-stage",
    "focus-left",
    "focus-right",
    "pro-terminal",
    "split-2col",
    "grid-3col",
    "grid-4col",
    "single-col",
];

const ALL_13_WIDGET_TYPES: WidgetType[] = [
    "BALANCE_GROWTH",
    "DAILY_WIN_RATE",
    "PROFIT_DIST",
    "LOT_DIST",
    "MONTHLY_ANALYTICS",
    "TOP_TRADES",
    "SYMBOL_PERF",
    "RECENT_TRADES",
    "TRADING_SESSIONS",
    "DAY_OF_WEEK",
    "TRADING_CALENDAR",
    "WIN_LOSS_COMPARISON",
    "PL_HEATMAP",
];

function create13WidgetLayout(): LayoutItem[] {
    return ALL_13_WIDGET_TYPES.map((type, idx) => ({
        i: `widget-${type.toLowerCase()}-${idx}`,
        type,
        x: 0,
        y: 0,
        w: WIDGET_REGISTRY[type]?.defaultW || 120,
        h: WIDGET_REGISTRY[type]?.defaultH || 66,
        minW: WIDGET_REGISTRY[type]?.minW || 40,
        minH: WIDGET_REGISTRY[type]?.minH || 30,
    }));
}

function check2DCollision(items: LayoutItem[]): { hasCollision: boolean; reason?: string } {
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];

            const overlapX = a.x < b.x + b.w && a.x + a.w > b.x;
            const overlapY = a.y < b.y + b.h && a.y + a.h > b.y;

            if (overlapX && overlapY) {
                return {
                    hasCollision: true,
                    reason: `Item ${a.i} [x:${a.x}, y:${a.y}, w:${a.w}, h:${a.h}] collides with ${b.i} [x:${b.x}, y:${b.y}, w:${b.w}, h:${b.h}]`,
                };
            }
        }
    }
    return { hasCollision: false };
}

// Coordinate mapper for lg/md/sm (12 cols) matching WidgetGrid.tsx toGridLayout
function projectTo12ColGrid(items: LayoutItem[]) {
    const COL_UNIT = 20;
    const ROW_UNIT = 4;
    return items.map((item) => {
        const minW = Math.max(2, Math.min(12, Math.round((item.minW || 40) / COL_UNIT)));
        const minH = Math.max(6, Math.round((item.minH || 30) / ROW_UNIT));
        const w = Math.max(minW, Math.min(12, Math.round(item.w / COL_UNIT)));
        const rawX = Math.max(0, Math.round(item.x / COL_UNIT));
        const x = Math.min(12 - w, rawX);
        const h = Math.max(minH, Math.round(item.h / ROW_UNIT));
        const y = Math.max(0, Math.round(item.y / ROW_UNIT));
        return { ...item, x, y, w, h, minW, minH };
    });
}

// Coordinate mapper for xs/mobile matching WidgetGrid.tsx toMobileStackLayout
function projectToMobileStack(items: LayoutItem[]) {
    const ROW_UNIT = 4;
    let currentY = 0;
    return items.map((item) => {
        const minH = Math.max(6, Math.round((item.minH || 30) / ROW_UNIT));
        const h = Math.max(minH, Math.round(item.h / ROW_UNIT));
        const y = currentY;
        currentY += h;
        return { ...item, x: 0, y, w: 1, h, minW: 1, minH };
    });
}

describe("grid-presets Bento Engine Verification", () => {
    describe("Suite 1: Preset Definitions & Registry Metadata", () => {
        it("defines exactly 12 presets matching GridPresetId", () => {
            expect(PRESET_DEFINITIONS).toHaveLength(12);
            const definedIds = PRESET_DEFINITIONS.map((p) => p.id);
            expect(definedIds.sort()).toEqual([...ALL_12_PRESET_IDS].sort());
        });

        it("validates every preset has valid title, badge, category, and preview element", () => {
            PRESET_DEFINITIONS.forEach((preset) => {
                expect(preset.id).toBeTypeOf("string");
                expect(preset.title).toBeDefined();
                expect(preset.title.length).toBeGreaterThan(0);
                expect(preset.badge).toBeDefined();
                expect(preset.badge.length).toBeGreaterThan(0);
                expect(["bento", "symmetric"]).toContain(preset.category);
                expect(preset.preview).toBeDefined();
            });
        });

        it("contains 8 bento presets and 4 symmetric presets", () => {
            const bento = PRESET_DEFINITIONS.filter((p) => p.category === "bento");
            const symmetric = PRESET_DEFINITIONS.filter((p) => p.category === "symmetric");
            expect(bento).toHaveLength(8);
            expect(symmetric).toHaveLength(4);
        });

        it("confirms all 13 registered widgets exist in WIDGET_REGISTRY", () => {
            expect(Object.keys(WIDGET_REGISTRY)).toHaveLength(13);
            ALL_13_WIDGET_TYPES.forEach((type) => {
                const config = WIDGET_REGISTRY[type];
                expect(config).toBeDefined();
                expect(config.defaultW).toBeGreaterThan(0);
                expect(config.defaultH).toBeGreaterThan(0);
                expect(config.minW).toBeGreaterThan(0);
                expect(config.minH).toBeGreaterThan(0);
            });
        });
    });

    describe("Suite 2: Full 13-Widget Layout Placement", () => {
        const baseLayout = create13WidgetLayout();

        ALL_12_PRESET_IDS.forEach((presetId) => {
            it(`places all 13 widgets without loss or duplication for preset: ${presetId}`, () => {
                const { grid, label } = buildPresetLayout(baseLayout, presetId);

                expect(grid).toHaveLength(13);
                const placedIds = grid.map((it) => it.i);
                expect(new Set(placedIds).size).toBe(13);

                const originalIds = baseLayout.map((it) => it.i);
                expect(placedIds.sort()).toEqual(originalIds.sort());

                const meta = PRESET_DEFINITIONS.find((p) => p.id === presetId);
                expect(label).toBe(meta?.title);
            });
        });
    });

    describe("Suite 3: Geometric Invariants on 240-Col Canvas", () => {
        const baseLayout = create13WidgetLayout();

        ALL_12_PRESET_IDS.forEach((presetId) => {
            it(`strictly satisfies boundary and raster constraints for preset: ${presetId}`, () => {
                const { grid } = buildPresetLayout(baseLayout, presetId);

                grid.forEach((item) => {
                    // Coordinates must be finite and not NaN
                    expect(Number.isFinite(item.x)).toBe(true);
                    expect(Number.isNaN(item.x)).toBe(false);
                    expect(Number.isFinite(item.y)).toBe(true);
                    expect(Number.isNaN(item.y)).toBe(false);
                    expect(Number.isFinite(item.w)).toBe(true);
                    expect(Number.isNaN(item.w)).toBe(false);
                    expect(Number.isFinite(item.h)).toBe(true);
                    expect(Number.isNaN(item.h)).toBe(false);

                    // Non-negative x, y
                    expect(item.x).toBeGreaterThanOrEqual(0);
                    expect(item.y).toBeGreaterThanOrEqual(0);

                    // Strictly positive dimensions
                    expect(item.w).toBeGreaterThan(0);
                    expect(item.h).toBeGreaterThan(0);

                    // Canvas boundary invariant: x + w <= 240
                    expect(item.x + item.w).toBeLessThanOrEqual(240);

                    // Height raster step: multiple of 4
                    expect(item.h % 4).toBe(0);

                    // Respects minimum height configured
                    const config = WIDGET_REGISTRY[item.type as WidgetType];
                    const minH = config?.minH || item.minH || 30;
                    expect(item.h).toBeGreaterThanOrEqual(minH);
                });
            });
        });
    });

    describe("Suite 4: 2D Spatial Non-Collision Detection", () => {
        const baseLayout = create13WidgetLayout();

        ALL_12_PRESET_IDS.forEach((presetId) => {
            it(`guarantees zero widget overlaps in 2D space for preset: ${presetId}`, () => {
                const { grid } = buildPresetLayout(baseLayout, presetId);
                const collisionCheck = check2DCollision(grid);
                expect(collisionCheck.hasCollision, collisionCheck.reason).toBe(false);
            });
        });
    });

    describe("Suite 5: Breakpoint Projections (lg, md, sm, xs)", () => {
        const baseLayout = create13WidgetLayout();

        ALL_12_PRESET_IDS.forEach((presetId) => {
            it(`projects safely to Desktop/Tablet 12-col grid (lg, md, sm) for preset: ${presetId}`, () => {
                const { grid } = buildPresetLayout(baseLayout, presetId);
                const desktopGrid = projectTo12ColGrid(grid);

                expect(desktopGrid).toHaveLength(13);
                desktopGrid.forEach((item) => {
                    expect(item.x).toBeGreaterThanOrEqual(0);
                    expect(item.w).toBeGreaterThanOrEqual(2);
                    expect(item.x + item.w).toBeLessThanOrEqual(12);
                    expect(item.y).toBeGreaterThanOrEqual(0);
                    expect(item.h).toBeGreaterThanOrEqual(6);
                    expect(Number.isFinite(item.x)).toBe(true);
                    expect(Number.isFinite(item.y)).toBe(true);
                });
            });

            it(`projects safely to Mobile 1-col vertical stack (xs, xxs) for preset: ${presetId}`, () => {
                const { grid } = buildPresetLayout(baseLayout, presetId);
                const mobileGrid = projectToMobileStack(grid);

                expect(mobileGrid).toHaveLength(13);
                mobileGrid.forEach((item, idx) => {
                    expect(item.x).toBe(0);
                    expect(item.w).toBe(1);
                    expect(item.h).toBeGreaterThanOrEqual(6);
                    if (idx > 0) {
                        const prev = mobileGrid[idx - 1];
                        expect(item.y).toBe(prev.y + prev.h);
                    } else {
                        expect(item.y).toBe(0);
                    }
                });
            });
        });
    });

    describe("Suite 6: Adversarial & Edge Case Stress Testing", () => {
        it("handles empty layout gracefully across all presets", () => {
            ALL_12_PRESET_IDS.forEach((presetId) => {
                const res = buildPresetLayout([], presetId);
                expect(res.grid).toEqual([]);
                expect(res.label).toBeDefined();
            });
        });

        it("handles 1-item layout without division by zero or NaN", () => {
            const singleItem: LayoutItem[] = [
                { i: "single-1", type: "BALANCE_GROWTH", x: 0, y: 0, w: 120, h: 66 },
            ];

            ALL_12_PRESET_IDS.forEach((presetId) => {
                const res = buildPresetLayout(singleItem, presetId);
                expect(res.grid).toHaveLength(1);
                const item = res.grid[0];
                expect(item.x).toBe(0);
                expect(item.y).toBe(0);
                expect(item.w).toBe(240);
                expect(item.h).toBeGreaterThan(0);
                expect(Number.isNaN(item.h)).toBe(false);
            });
        });

        it("handles 2-item layout across all presets without collisions", () => {
            const twoItems: LayoutItem[] = [
                { i: "item-1", type: "BALANCE_GROWTH", x: 0, y: 0, w: 120, h: 66 },
                { i: "item-2", type: "DAILY_WIN_RATE", x: 0, y: 0, w: 120, h: 66 },
            ];

            ALL_12_PRESET_IDS.forEach((presetId) => {
                const res = buildPresetLayout(twoItems, presetId);
                expect(res.grid).toHaveLength(2);
                res.grid.forEach((it) => {
                    expect(it.x).toBeGreaterThanOrEqual(0);
                    expect(it.y).toBeGreaterThanOrEqual(0);
                    expect(it.w).toBeGreaterThan(0);
                    expect(it.h).toBeGreaterThan(0);
                    expect(it.x + it.w).toBeLessThanOrEqual(240);
                });
                const collision = check2DCollision(res.grid);
                expect(collision.hasCollision, `${presetId}: ${collision.reason}`).toBe(false);
            });
        });

        it("handles 3-item layout across all presets without collisions", () => {
            const threeItems: LayoutItem[] = [
                { i: "item-1", type: "BALANCE_GROWTH", x: 0, y: 0, w: 120, h: 66 },
                { i: "item-2", type: "DAILY_WIN_RATE", x: 0, y: 0, w: 120, h: 66 },
                { i: "item-3", type: "PROFIT_DIST", x: 0, y: 0, w: 120, h: 66 },
            ];

            ALL_12_PRESET_IDS.forEach((presetId) => {
                const res = buildPresetLayout(threeItems, presetId);
                expect(res.grid).toHaveLength(3);
                const collision = check2DCollision(res.grid);
                expect(collision.hasCollision, `${presetId}: ${collision.reason}`).toBe(false);
            });
        });

        it("stress-tests arbitrary item counts (N = 1..15) across all presets", () => {
            const allItems = create13WidgetLayout();
            for (let n = 1; n <= 15; n++) {
                // Generate n items (cycling types if n > 13)
                const itemsSlice: LayoutItem[] = Array.from({ length: n }, (_, i) => ({
                    i: `stress-${i}`,
                    type: allItems[i % allItems.length].type,
                    x: 0,
                    y: 0,
                    w: 120,
                    h: 66,
                }));

                ALL_12_PRESET_IDS.forEach((presetId) => {
                    const res = buildPresetLayout(itemsSlice, presetId);
                    expect(res.grid).toHaveLength(n);
                    res.grid.forEach((it) => {
                        expect(it.x).toBeGreaterThanOrEqual(0);
                        expect(it.y).toBeGreaterThanOrEqual(0);
                        expect(it.w).toBeGreaterThan(0);
                        expect(it.h).toBeGreaterThan(0);
                        expect(it.x + it.w).toBeLessThanOrEqual(240);
                        expect(Number.isFinite(it.x)).toBe(true);
                        expect(Number.isFinite(it.y)).toBe(true);
                    });
                    const collision = check2DCollision(res.grid);
                    expect(
                        collision.hasCollision,
                        `N=${n}, preset=${presetId}: ${collision.reason}`
                    ).toBe(false);
                });
            }
        });

        it("handles unregistered custom widget type safely with fallbacks", () => {
            const customLayout: LayoutItem[] = [
                { i: "custom-1", type: "UNKNOWN_CUSTOM_WIDGET", x: 0, y: 0, w: 100, h: 50 },
                { i: "custom-2", type: "ANOTHER_UNKNOWN", x: 0, y: 0, w: 100, h: 50 },
                { i: "custom-3", type: "THIRD_UNKNOWN", x: 0, y: 0, w: 100, h: 50 },
            ];

            ALL_12_PRESET_IDS.forEach((presetId) => {
                const res = buildPresetLayout(customLayout, presetId);
                expect(res.grid).toHaveLength(3);
                res.grid.forEach((it) => {
                    expect(it.x).toBeGreaterThanOrEqual(0);
                    expect(it.y).toBeGreaterThanOrEqual(0);
                    expect(it.w).toBeGreaterThan(0);
                    expect(it.h).toBeGreaterThan(0);
                    expect(it.x + it.w).toBeLessThanOrEqual(240);
                });
                const collision = check2DCollision(res.grid);
                expect(collision.hasCollision, `${presetId}: ${collision.reason}`).toBe(false);
            });
        });
    });

    describe("Suite 7: Specific Preset Behavioral Signatures", () => {
        it("triple-stage elevates widest widget into center stage (x: 60, w: 120)", () => {
            const items: LayoutItem[] = [
                { i: "narrow-1", type: "BALANCE_GROWTH", x: 0, y: 0, w: 120, h: 66 },
                { i: "narrow-2", type: "DAILY_WIN_RATE", x: 0, y: 0, w: 120, h: 66 },
                { i: "wide-1", type: "MONTHLY_ANALYTICS", x: 0, y: 0, w: 240, h: 88 }, // defaultW 240 + minW 60 = 300
            ];

            const { grid } = buildPresetLayout(items, "triple-stage");
            expect(grid).toHaveLength(3);

            // Center item at index 1 must be wide-1 with w: 120, x: 60
            const centerItem = grid.find((it) => it.x === 60);
            expect(centerItem).toBeDefined();
            expect(centerItem?.w).toBe(120);
            expect(centerItem?.i).toBe("wide-1");

            // Wing items must be at x: 0 (w: 60) and x: 180 (w: 60)
            const leftWing = grid.find((it) => it.x === 0);
            const rightWing = grid.find((it) => it.x === 180);
            expect(leftWing?.w).toBe(60);
            expect(rightWing?.w).toBe(60);
        });

        it("focus-left vs focus-right vs pro-terminal geometry signatures", () => {
            const items: LayoutItem[] = [
                { i: "focus", type: "BALANCE_GROWTH", x: 0, y: 0, w: 120, h: 66 },
                { i: "side-1", type: "DAILY_WIN_RATE", x: 0, y: 0, w: 120, h: 66 },
                { i: "side-2", type: "PROFIT_DIST", x: 0, y: 0, w: 120, h: 66 },
            ];

            // Focus Left: focus at x: 0, w: 160; sides at x: 160, w: 80
            const leftRes = buildPresetLayout(items, "focus-left");
            const focusLeft = leftRes.grid.find((it) => it.i === "focus");
            expect(focusLeft?.x).toBe(0);
            expect(focusLeft?.w).toBe(160);

            // Focus Right: focus at x: 80, w: 160; sides at x: 0, w: 80
            const rightRes = buildPresetLayout(items, "focus-right");
            const focusRight = rightRes.grid.find((it) => it.i === "focus");
            expect(focusRight?.x).toBe(80);
            expect(focusRight?.w).toBe(160);

            // Pro Terminal: focus at x: 0, w: 180; sides at x: 180, w: 60
            const proRes = buildPresetLayout(items, "pro-terminal");
            const focusPro = proRes.grid.find((it) => it.i === "focus");
            expect(focusPro?.x).toBe(0);
            expect(focusPro?.w).toBe(180);
        });

        it("hero-split places hero (w: 160) and companion (w: 80) on row 0", () => {
            const items: LayoutItem[] = [
                { i: "hero", type: "BALANCE_GROWTH", x: 0, y: 0, w: 120, h: 66 },
                { i: "companion", type: "DAILY_WIN_RATE", x: 0, y: 0, w: 120, h: 66 },
                { i: "sub-1", type: "PROFIT_DIST", x: 0, y: 0, w: 120, h: 66 },
            ];

            const { grid } = buildPresetLayout(items, "hero-split");
            const hero = grid.find((it) => it.i === "hero");
            const companion = grid.find((it) => it.i === "companion");
            const sub1 = grid.find((it) => it.i === "sub-1");

            expect(hero?.x).toBe(0);
            expect(hero?.w).toBe(160);
            expect(hero?.y).toBe(0);

            expect(companion?.x).toBe(160);
            expect(companion?.w).toBe(80);
            expect(companion?.y).toBe(0);

            expect(sub1?.y).toBeGreaterThanOrEqual(hero!.h);
        });
    });
});
