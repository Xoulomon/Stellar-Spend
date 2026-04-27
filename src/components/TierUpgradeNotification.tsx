"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { type LoyaltyTier, getTierConfig } from "@/lib/loyalty";

interface Props {
  tier: LoyaltyTier | null;
  onDismiss: () => void;
}

/**
 * Displays a brief tier-upgrade banner. Auto-dismisses after 6 seconds.
 */
export default function TierUpgradeNotification({ tier, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!tier) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); onDismiss(); }, 6000);
    return () => clearTimeout(t);
  }, [tier, onDismiss]);

  if (!tier || !visible) return null;

  const config = getTierConfig(tier);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-6 right-6 z-50 border p-4 max-w-xs shadow-lg",
        "bg-[#111111] animate-in slide-in-from-bottom-4 duration-300",
      )}
      style={{ borderColor: config.color + "88" }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">🏆</span>
        <div className="space-y-0.5">
          <div className="text-xs font-bold text-white tracking-wider">
            Tier Upgrade!
          </div>
          <div className="text-xs" style={{ color: config.color }}>
            You&apos;ve reached <strong>{config.label}</strong> status
          </div>
          <div className="text-[10px] text-[#777777]">
            {config.benefits[0]}
          </div>
        </div>
        <button
          onClick={() => { setVisible(false); onDismiss(); }}
          className="ml-auto text-[#555555] hover:text-white text-xs"
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
