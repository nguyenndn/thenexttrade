/**
 * Feature Flags Configuration for TraderWaves Features.
 * Controls progressive rollout on both client and server side.
 * Defaults are set to false (disabled) for safety.
 */

export function isSyncHealthCenterEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SYNC_HEALTH_CENTER === "true";
}

export function isPrivacyPresetsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_PRIVACY_PRESETS === "true";
}

export function isRulebookGoalsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_RULEBOOK_GOALS === "true";
}

export function isTradePlansEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_TRADE_PLANS === "true";
}
