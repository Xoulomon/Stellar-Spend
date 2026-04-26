/**
 * Loyalty program — reward frequent users with tier-based benefits.
 * Tiers are determined by cumulative USDC volume transacted.
 */

export type LoyaltyTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface TierConfig {
  tier: LoyaltyTier;
  label: string;
  minVolume: number;   // USDC
  color: string;
  benefits: string[];
}

export const TIERS: TierConfig[] = [
  {
    tier: 'bronze',
    label: 'Bronze',
    minVolume: 0,
    color: '#cd7f32',
    benefits: ['Transaction history', 'Basic support'],
  },
  {
    tier: 'silver',
    label: 'Silver',
    minVolume: 500,
    color: '#c0c0c0',
    benefits: ['Priority support', '0.1% fee discount'],
  },
  {
    tier: 'gold',
    label: 'Gold',
    minVolume: 2000,
    color: '#c9a962',
    benefits: ['Dedicated support', '0.25% fee discount', 'Early access to features'],
  },
  {
    tier: 'platinum',
    label: 'Platinum',
    minVolume: 10000,
    color: '#e5e4e2',
    benefits: ['VIP support', '0.5% fee discount', 'Early access', 'Custom limits'],
  },
];

export interface LoyaltyProfile {
  userAddress: string;
  totalVolume: number;   // cumulative USDC
  transactionCount: number;
  tier: LoyaltyTier;
  updatedAt: number;
}

const STORAGE_KEY = 'stellar_spend_loyalty';

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function getTierForVolume(volume: number): LoyaltyTier {
  const sorted = [...TIERS].sort((a, b) => b.minVolume - a.minVolume);
  return (sorted.find((t) => volume >= t.minVolume) ?? TIERS[0]).tier;
}

export function getTierConfig(tier: LoyaltyTier): TierConfig {
  return TIERS.find((t) => t.tier === tier) ?? TIERS[0];
}

export function getNextTier(tier: LoyaltyTier): TierConfig | null {
  const idx = TIERS.findIndex((t) => t.tier === tier);
  return idx < TIERS.length - 1 ? TIERS[idx + 1] : null;
}

export function volumeToNextTier(profile: LoyaltyProfile): number | null {
  const next = getNextTier(profile.tier);
  if (!next) return null;
  return Math.max(0, next.minVolume - profile.totalVolume);
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export class LoyaltyStorage {
  static get(userAddress: string): LoyaltyProfile {
    if (typeof window === 'undefined') return this._default(userAddress);
    try {
      const all: Record<string, LoyaltyProfile> = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? '{}',
      );
      return all[userAddress.toLowerCase()] ?? this._default(userAddress);
    } catch {
      return this._default(userAddress);
    }
  }

  /**
   * Record a completed transaction and return the updated profile.
   * Returns the new tier if it changed (for upgrade notification), else null.
   */
  static recordTransaction(
    userAddress: string,
    usdcAmount: number,
  ): { profile: LoyaltyProfile; upgradedTo: LoyaltyTier | null } {
    const prev = this.get(userAddress);
    const newVolume = prev.totalVolume + usdcAmount;
    const newTier = getTierForVolume(newVolume);
    const profile: LoyaltyProfile = {
      userAddress: userAddress.toLowerCase(),
      totalVolume: newVolume,
      transactionCount: prev.transactionCount + 1,
      tier: newTier,
      updatedAt: Date.now(),
    };
    this._save(profile);
    return {
      profile,
      upgradedTo: newTier !== prev.tier ? newTier : null,
    };
  }

  private static _save(profile: LoyaltyProfile): void {
    if (typeof window === 'undefined') return;
    try {
      const all: Record<string, LoyaltyProfile> = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? '{}',
      );
      all[profile.userAddress.toLowerCase()] = profile;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
      // ignore
    }
  }

  private static _default(userAddress: string): LoyaltyProfile {
    return {
      userAddress: userAddress.toLowerCase(),
      totalVolume: 0,
      transactionCount: 0,
      tier: 'bronze',
      updatedAt: Date.now(),
    };
  }
}
