export type LoyaltyRewardType = 'SYSTEM_PERK' | 'CASH' | 'PHYSICAL_GIFT';
export type LoyaltyClaimStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
export type UsdtNetwork = 'BEP20' | 'TRC20' | 'ERC20';

export interface LoyaltyTierItem {
  id?: string;
  level: number;
  name: string;
  requiredLots: number;
  rewardType: LoyaltyRewardType;
  rewardTitle: string;
  cashAmount: number;
  perkDescription: string;
  icon: string;
  badgeColor: string;
  order: number;
  isActive: boolean;
}

export interface UserLoyaltyProgress {
  totalCumulativeLots: number;
  currentTier: LoyaltyTierItem | null;
  nextTier: LoyaltyTierItem | null;
  progressToNext: number; // 0 to 100
  lotsToNext: number;
  claimedLevels: number[];
  pendingLevels: number[];
  tiers: (LoyaltyTierItem & {
    isUnlocked: boolean;
    isClaimed: boolean;
    isPending: boolean;
    canClaim: boolean;
  })[];
  eligibility: {
    hasPartnerBrokerAccount: boolean;
    activeLiveAccounts: number;
    totalClosedTrades: number;
    lastTradeAt: string | null;
  };
  userClaims?: LoyaltyClaimRecord[];
  payoutWallet?: {
    network: UsdtNetwork;
    address: string;
  } | null;
}

export interface LoyaltyClaimRecord {
  id: string;
  userId: string;
  tierId?: string | null;
  level: number;
  tierName: string;
  requiredLots: number;
  actualLots: number;
  rewardType: LoyaltyRewardType;
  rewardTitle: string;
  cashAmount?: number | null;
  payoutMethod: string;
  network?: string | null;
  usdtAddress?: string | null;
  status: LoyaltyClaimStatus;
  adminNotes?: string | null;
  transactionRef?: string | null;
  claimedAt: string | Date;
  processedAt?: string | Date | null;
  processedBy?: string | null;
  user?: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

export interface ClaimRewardInput {
  level: number;
  network?: UsdtNetwork;
  usdtAddress?: string;
  note?: string;
}

export interface ProcessClaimInput {
  claimId: string;
  action: 'APPROVE' | 'REJECT' | 'COMPLETE';
  transactionRef?: string;
  adminNotes?: string;
}
