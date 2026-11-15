import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PSYCH_POSTS } from "./showcase-data/psychology-posts";
import { RISK_RULES_POSTS } from "./showcase-data/risk-rules-posts";
import { SD_PA_TIPS_POSTS } from "./showcase-data/sd-pa-tips-posts";
import {
    pickServerRandomIndices,
    resolveVisitIndices,
} from "./showcase-data/shuffle-deck";
import { TelegramShowcaseMockup } from "./TelegramShowcaseMockup";

const BANNED_AI_PHRASES = [
    "unlock your potential",
    "elevate your trading",
    "your next move",
    "empowering traders",
    "seamlessly",
    "deep dive",
    "delve",
    "master the art",
    "testament",
    "fast-paced markets",
    "beacon of hope",
    "game-changing",
    "revolutionize",
    "supercharge",
    "breek",
];

describe("Community 3-Tab Showcase Content & Random Rotation", () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ success: false }),
            })
        );
    });

    it("provides at least 30 unique, cliché-free posts per tab with unified titles", () => {
        expect(PSYCH_POSTS.length).toBeGreaterThanOrEqual(30);
        expect(RISK_RULES_POSTS.length).toBeGreaterThanOrEqual(30);
        expect(SD_PA_TIPS_POSTS.length).toBeGreaterThanOrEqual(30);

        const allTabs = [PSYCH_POSTS, RISK_RULES_POSTS, SD_PA_TIPS_POSTS];
        for (const posts of allTabs) {
            const titles = new Set(posts.map((p) => p.title));
            expect(titles.size).toBe(posts.length);

            for (const post of posts) {
                expect(post.title.endsWith(":")).toBe(true);
                const combined = `${post.title} ${post.body} ${post.footerLeft} ${post.footerRight}`.toLowerCase();
                for (const banned of BANNED_AI_PHRASES) {
                    expect(combined).not.toContain(banned);
                }
            }
        }

        for (const riskPost of RISK_RULES_POSTS) {
            expect(riskPost.title).not.toMatch(/^Rule\s*#/i);
        }
    });

    it("rotates indices without immediate repetition across consecutive /community visits", () => {
        const mem: Record<string, string> = {};
        const mockStorage = {
            getItem: (k: string) => mem[k] ?? null,
            setItem: (k: string, v: string) => {
                mem[k] = v;
            },
        };

        const firstVisit = resolveVisitIndices(
            { psych: 4, mindset: 9, tips: 12 },
            mockStorage
        );
        expect(firstVisit).toEqual({ psych: 4, mindset: 9, tips: 12 });

        // Simulate revisiting /community with a cached or colliding seed: must rotate to new unseen items
        const secondVisit = resolveVisitIndices(
            { psych: 4, mindset: 9, tips: 12 },
            mockStorage
        );
        expect(secondVisit.psych).not.toBe(4);
        expect(secondVisit.mindset).not.toBe(9);
        expect(secondVisit.tips).not.toBe(12);

        const serverSeed = pickServerRandomIndices(() => 0.5);
        expect(serverSeed.psych).toBe(Math.floor(0.5 * PSYCH_POSTS.length));
    });

    it("renders unified pill badges across Psychology, Risk Rules, and S&D + PA Tips", async () => {
        render(
            <TelegramShowcaseMockup
                telegramUrl="https://t.me/GoldScalperNinja"
                initialIndices={{ psych: 2, mindset: 5, tips: 7 }}
            />
        );

        expect(screen.getByText("Mindset Shift")).toBeDefined();
        expect(screen.getByText(PSYCH_POSTS[2].title)).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: /Risk Rules/i }));
        await waitFor(() => {
            expect(screen.getByText("Capital Protection")).toBeDefined();
            expect(screen.getByText(RISK_RULES_POSTS[5].title)).toBeDefined();
        });

        fireEvent.click(
            screen.getByRole("button", { name: /S&D \+ PA Tips/i })
        );
        await waitFor(() => {
            expect(screen.getByText("Execution Edge")).toBeDefined();
            expect(screen.getByText(SD_PA_TIPS_POSTS[7].title)).toBeDefined();
        });
    });
});
