import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { DesktopNav } from "./DesktopNav";

vi.mock("next/navigation", () => ({
    usePathname: () => "/",
}));

describe("DesktopNav", () => {
    it("renders all core menu items with responsive compact styling for 1024px", () => {
        const html = renderToString(<DesktopNav />);

        // Verify core menu items are present
        expect(html).toContain("Home");
        expect(html).toContain("Knowledge");
        expect(html).toContain("Academy");
        expect(html).toContain("Trading Systems");
        expect(html).toContain("Tools");
        expect(html).toContain("Trading Style");
        expect(html).toContain("Brokers");
        expect(html).toContain("Community");

        // Verify responsive shortName labels for lg viewports
        expect(html).toContain("Systems");
        expect(html).toContain("Style");

        // Verify responsive font sizes and gaps preventing horizontal truncation at 1024px
        expect(html).toContain("text-base");
        expect(html).toContain("gap-1.5 lg:gap-2 xl:gap-6");
    });
});
