import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { AcademyPublicCTA } from "./AcademyPublicCTA";

describe("AcademyPublicCTA", () => {
    it("renders 'Continue Learning' immediately when user is logged in", () => {
        const html = renderToString(<AcademyPublicCTA isLoggedIn={true} />);
        expect(html).toContain("Continue Learning");
        expect(html).toContain("/dashboard/academy");
    });

    it("renders 'Explore the Curriculum' immediately when user is a guest", () => {
        const html = renderToString(<AcademyPublicCTA isLoggedIn={false} />);
        expect(html).toContain("Explore the Curriculum");
        expect(html).toContain("/auth/login");
    });

    it("defaults to guest state when isLoggedIn is not provided", () => {
        const html = renderToString(<AcademyPublicCTA />);
        expect(html).toContain("Explore the Curriculum");
        expect(html).toContain("/auth/login");
    });
});
