import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { BrokerFundedMembershipSection } from "./BrokerFundedMembershipSection";

describe("BrokerFundedMembershipSection", () => {
    it("renders the headline and core zero-fee message correctly", () => {
        const html = renderToString(<BrokerFundedMembershipSection isLoggedIn={false} />);
        const text = html.replace(/<[^>]+>/g, "");

        // Verify key messaging
        expect(text).toContain("You never pay us");
        expect(text).toContain("Your $200 stays 100% yours");
        expect(text).toContain("Typical Signal / Course Group");
        expect(text).toContain("TheNextTrade Ecosystem");
        expect(text).toContain("You fund your own account");
        expect(text).toContain("TheNextTrade receives $0");
    });

    it("renders trust pills and money flow indicators", () => {
        const html = renderToString(<BrokerFundedMembershipSection isLoggedIn={true} />);

        expect(html).toContain("Withdraw Anytime");
        expect(html).toContain("100% In Your Name");
        expect(html).toContain("No Monthly Subscription");
        expect(html).toContain("Your Broker Account");
    });

    it("renders CTA according to logged-in state", () => {
        const loggedOutHtml = renderToString(<BrokerFundedMembershipSection isLoggedIn={false} />);
        expect(loggedOutHtml).toContain("Unlock VIP via Broker Deposit");

        const loggedInHtml = renderToString(<BrokerFundedMembershipSection isLoggedIn={true} />);
        expect(loggedInHtml).toContain("Connect Your Broker Account");
    });
});
