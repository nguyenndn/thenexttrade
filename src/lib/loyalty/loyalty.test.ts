import { describe, it, expect } from "vitest";
import { DEFAULT_LOYALTY_TIERS } from "./loyalty.server";

describe("Loyalty & Rewards Program Unit Tests", () => {
  describe("Tier Definitions", () => {
    it("should have exactly 10 standard loyalty tiers", () => {
      expect(DEFAULT_LOYALTY_TIERS).toHaveLength(10);
    });

    it("should have strictly ascending levels from 1 to 10", () => {
      DEFAULT_LOYALTY_TIERS.forEach((tier, index) => {
        expect(tier.level).toBe(index + 1);
        expect(tier.order).toBe(index + 1);
      });
    });

    it("should have strictly increasing required lot thresholds", () => {
      for (let i = 1; i < DEFAULT_LOYALTY_TIERS.length; i++) {
        expect(DEFAULT_LOYALTY_TIERS[i].requiredLots).toBeGreaterThan(
          DEFAULT_LOYALTY_TIERS[i - 1].requiredLots
        );
      }
    });

    it("should have positive cash amounts for all tiers (1 through 10)", () => {
      for (let i = 0; i < DEFAULT_LOYALTY_TIERS.length; i++) {
        expect(DEFAULT_LOYALTY_TIERS[i].cashAmount).toBeGreaterThan(0);
      }
    });

    it("Level 10 (The Sovereign) should require 10,000 lots and offer $18,000 USDT", () => {
      const topTier = DEFAULT_LOYALTY_TIERS[9];
      expect(topTier.level).toBe(10);
      expect(topTier.name).toBe("The Sovereign");
      expect(topTier.requiredLots).toBe(10000);
      expect(topTier.cashAmount).toBe(18000);
    });
  });

  describe("Progress Calculation Engine", () => {
    function calculateMockProgress(totalLots: number, claimedLevels: number[] = []) {
      const tiers = DEFAULT_LOYALTY_TIERS;
      let currentTier = null;
      let nextTier = null;

      for (let i = 0; i < tiers.length; i++) {
        if (totalLots >= tiers[i].requiredLots) {
          currentTier = tiers[i];
        } else {
          nextTier = tiers[i];
          break;
        }
      }

      let progressToNext = 100;
      let lotsToNext = 0;

      if (nextTier) {
        const prevRequired = currentTier ? currentTier.requiredLots : 0;
        const range = nextTier.requiredLots - prevRequired;
        const currentProgressInBracket = Math.max(0, totalLots - prevRequired);
        progressToNext = Math.min(100, Math.round((currentProgressInBracket / range) * 100));
        lotsToNext = Number(Math.max(0, nextTier.requiredLots - totalLots).toFixed(2));
      }

      const enrichedTiers = tiers.map((tier) => {
        const isUnlocked = totalLots >= tier.requiredLots;
        const isClaimed = claimedLevels.includes(tier.level);
        const canClaim = isUnlocked && !isClaimed;

        return {
          ...tier,
          isUnlocked,
          isClaimed,
          canClaim,
        };
      });

      return {
        currentTier,
        nextTier,
        progressToNext,
        lotsToNext,
        enrichedTiers,
      };
    }

    it("calculates initial 0 lots correctly", () => {
      const result = calculateMockProgress(0);
      expect(result.currentTier).toBeNull();
      expect(result.nextTier?.level).toBe(1);
      expect(result.lotsToNext).toBe(10);
      expect(result.progressToNext).toBe(0);
      expect(result.enrichedTiers[0].canClaim).toBe(false);
    });

    it("calculates mid-bracket progress accurately (15 lots)", () => {
      // 15 lots is between Level 1 (10) and Level 2 (50).
      // Bracket range = 50 - 10 = 40. Progress in bracket = 15 - 10 = 5.
      // Progress % = 5/40 = 12.5% -> round to 13%. Lots to next = 50 - 15 = 35.
      const result = calculateMockProgress(15);
      expect(result.currentTier?.level).toBe(1);
      expect(result.nextTier?.level).toBe(2);
      expect(result.progressToNext).toBe(13);
      expect(result.lotsToNext).toBe(35);
      expect(result.enrichedTiers[0].isUnlocked).toBe(true);
      expect(result.enrichedTiers[0].canClaim).toBe(true);
      expect(result.enrichedTiers[1].isUnlocked).toBe(false);
    });

    it("recognizes claimed tiers so they cannot be claimed again", () => {
      const result = calculateMockProgress(60, [1, 2]);
      // At 60 lots, Level 1 (10) and Level 2 (50) are unlocked.
      // Since they are claimed, canClaim must be false.
      expect(result.enrichedTiers[0].isClaimed).toBe(true);
      expect(result.enrichedTiers[0].canClaim).toBe(false);
      expect(result.enrichedTiers[1].isClaimed).toBe(true);
      expect(result.enrichedTiers[1].canClaim).toBe(false);
    });

    it("handles maximum tier reached (12,000 lots)", () => {
      const result = calculateMockProgress(12000);
      expect(result.currentTier?.level).toBe(10);
      expect(result.nextTier).toBeNull();
      expect(result.progressToNext).toBe(100);
      expect(result.lotsToNext).toBe(0);
      expect(result.enrichedTiers.every((t) => t.isUnlocked)).toBe(true);
    });
  });

  describe("USDT Wallet Validation Rules", () => {
    function validateUsdtAddress(network: "BEP20" | "TRC20" | "ERC20", address: string): boolean {
      if (!address || address.trim().length < 24) return false;
      const clean = address.trim();
      if (network === "TRC20") return clean.startsWith("T");
      if (network === "BEP20" || network === "ERC20") return clean.startsWith("0x");
      return false;
    }

    it("validates BEP20/ERC20 addresses with 0x prefix", () => {
      expect(validateUsdtAddress("BEP20", "0x71C81373b0Da80A03656Cde90A567b438258525b")).toBe(true);
      expect(validateUsdtAddress("BEP20", "T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb")).toBe(false);
      expect(validateUsdtAddress("BEP20", "invalid")).toBe(false);
    });

    it("validates TRC20 addresses with T prefix", () => {
      expect(validateUsdtAddress("TRC20", "TXkQy8vLz3QkHw4xAB7dbGeiX9h8unkK4x")).toBe(true);
      expect(validateUsdtAddress("TRC20", "0x71C81373b0Da80A03656Cde90A567b438258525b")).toBe(false);
    });
  });
});
