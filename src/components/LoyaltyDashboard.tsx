"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  type LoyaltyProfile,
  type LoyaltyTier,
  LoyaltyStorage,
  TIERS,
  getTierConfig,
  getNextTier,
  volumeToNextTier,
} from "@/lib/loyalty";

interface Props {
  userAddress: string;
  /** Called when a tier upgrade is detected (for external notification) */
  onTierUpgrade?: (tier: LoyaltyTier) => void;
}

export default function LoyaltyDashboard({ userAddress, onTierUpgrade }: Props) {
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);

  useEffect(() => {
    if (!userAddress) return;
    setProfile(LoyaltyStorage.get(userAddress));
  }, [userAddress]);

  if (!profile) return null;

  const tierConfig = getTierConfig(profile.tier);
  const nextTier = getNextTier(profile.tier);
  const remaining = volumeToNextTier(profile);
  const progressPct = nextTier
    ? Math.min(100, ((profile.totalVolume - (TIERS.find((t) => t.tier === profile.tier)?.minVolume ?? 0)) /
        (nextTier.minVolume - (TIERS.find((t) => t.tier === profile.tier)?.minVolume ?? 0))) * 100)
    : 100;

  return (
    <div className="border border-[#333333] bg-[#111111] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white tracking-wider uppercase">
          Loyalty Status
        </h2>
        <span
          className="text-xs font-bold tracking-widest uppercase px-3 py-1 border"
          style={{ color: tierConfig.color, borderColor: tierConfig.color + "55" }}
        >
          {tierConfig.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="border border-[#222222] p-3">
          <div className="text-[10px] text-[#777777] uppercase tracking-widest mb-1">Total Volume</div>
          <div className="text-sm text-white font-semibold tabular-nums">
            {profile.totalVolume.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
        </div>
        <div className="border border-[#222222] p-3">
          <div className="text-[10px] text-[#777777] uppercase tracking-widest mb-1">Transactions</div>
          <div className="text-sm text-white font-semibold tabular-nums">{profile.transactionCount}</div>
        </div>
      </div>

      {/* Progress to next tier */}
      {nextTier && remaining !== null && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-[#777777]">
            <span>Progress to {nextTier.label}</span>
            <span>{remaining.toLocaleString("en-US", { maximumFractionDigits: 0 })} USDC remaining</span>
          </div>
          <div className="h-1.5 bg-[#222222] w-full">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: nextTier.color }}
            />
          </div>
        </div>
      )}

      {/* Benefits */}
      <div>
        <div className="text-[10px] text-[#777777] uppercase tracking-widest mb-2">Your Benefits</div>
        <ul className="space-y-1">
          {tierConfig.benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-xs text-[#aaaaaa]">
              <span style={{ color: tierConfig.color }}>✓</span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      {/* All tiers */}
      <div>
        <div className="text-[10px] text-[#777777] uppercase tracking-widest mb-2">All Tiers</div>
        <div className="flex gap-2">
          {TIERS.map((t) => (
            <div
              key={t.tier}
              className={cn(
                "flex-1 border p-2 text-center",
                t.tier === profile.tier ? "border-opacity-100" : "border-[#222222] opacity-40",
              )}
              style={t.tier === profile.tier ? { borderColor: t.color + "88" } : {}}
            >
              <div className="text-[10px] font-bold" style={{ color: t.color }}>{t.label}</div>
              <div className="text-[9px] text-[#555555] mt-0.5">{t.minVolume.toLocaleString()}+</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
