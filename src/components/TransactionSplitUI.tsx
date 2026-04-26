"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  type SplitRecipient,
  type SplitTransaction,
  computeSplitAmounts,
  validateSplit,
  SplitStorage,
} from "@/lib/transaction-split";

interface Props {
  totalAmount: string;
  currency: string;
  onConfirm: (split: SplitTransaction) => void;
  onCancel: () => void;
}

function newRecipient(id: number): SplitRecipient {
  return { id: `r${id}`, label: `Recipient ${id}`, percentage: 0 };
}

export default function TransactionSplitUI({ totalAmount, currency, onConfirm, onCancel }: Props) {
  const [recipients, setRecipients] = useState<SplitRecipient[]>([
    { id: "r1", label: "Recipient 1", percentage: 50 },
    { id: "r2", label: "Recipient 2", percentage: 50 },
  ]);
  const [counter, setCounter] = useState(3);

  const total = recipients.reduce((s, r) => s + r.percentage, 0);
  const validationError = validateSplit(recipients);
  const preview = computeSplitAmounts(totalAmount, recipients);

  const update = (id: string, field: keyof SplitRecipient, value: string | number) =>
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );

  const addRecipient = () => {
    setRecipients((prev) => [...prev, newRecipient(counter)]);
    setCounter((c) => c + 1);
  };

  const removeRecipient = (id: string) =>
    setRecipients((prev) => prev.filter((r) => r.id !== id));

  const handleConfirm = () => {
    if (validationError) return;
    const split: SplitTransaction = {
      id: SplitStorage.generateId(),
      createdAt: Date.now(),
      totalAmount,
      currency,
      recipients: computeSplitAmounts(totalAmount, recipients),
      status: "pending",
      results: {},
    };
    SplitStorage.save(split);
    onConfirm(split);
  };

  return (
    <div className="border border-[#333333] bg-[#111111] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white tracking-wider uppercase">
          Split Transaction
        </h2>
        <span className="text-xs text-[#777777]">
          Total: {totalAmount} USDC
        </span>
      </div>

      {/* Recipients */}
      <div className="space-y-2">
        {recipients.map((r) => {
          const preview_r = preview.find((p) => p.id === r.id);
          return (
            <div key={r.id} className="flex items-center gap-2">
              <input
                value={r.label}
                onChange={(e) => update(r.id, "label", e.target.value)}
                placeholder="Label"
                aria-label={`Label for ${r.label}`}
                className={cn(
                  "flex-1 bg-[#0a0a0a] border border-[#333333] px-3 py-2 text-xs text-white",
                  "focus:outline-none focus:border-[#c9a962]",
                )}
              />
              <input
                type="number"
                min={0}
                max={100}
                value={r.percentage}
                onChange={(e) => update(r.id, "percentage", parseFloat(e.target.value) || 0)}
                aria-label={`Percentage for ${r.label}`}
                className={cn(
                  "w-20 bg-[#0a0a0a] border border-[#333333] px-3 py-2 text-xs text-white text-right",
                  "focus:outline-none focus:border-[#c9a962]",
                )}
              />
              <span className="text-xs text-[#777777] w-4">%</span>
              <span className="text-xs text-[#aaaaaa] w-24 text-right tabular-nums">
                {preview_r?.amount ?? "—"} USDC
              </span>
              {recipients.length > 2 && (
                <button
                  onClick={() => removeRecipient(r.id)}
                  className="text-[#555555] hover:text-red-400 text-xs px-1"
                  aria-label={`Remove ${r.label}`}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Total indicator */}
      <div className={cn("text-xs text-right", Math.abs(total - 100) < 0.01 ? "text-green-400" : "text-yellow-400")}>
        Total: {total.toFixed(2)}%
      </div>

      {validationError && (
        <p role="alert" className="text-xs text-red-400">{validationError}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={addRecipient}
          className={cn(
            "text-[10px] tracking-widest uppercase px-3 py-2 border border-[#333333] text-[#777777]",
            "hover:border-[#c9a962] hover:text-[#c9a962] transition-colors duration-150",
          )}
        >
          + Add Recipient
        </button>
        <div className="ml-auto flex gap-2">
          <button
            onClick={onCancel}
            className={cn(
              "text-[10px] tracking-widest uppercase px-4 py-2 border border-[#333333] text-[#777777]",
              "hover:border-[#555555] transition-colors duration-150",
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!!validationError}
            className={cn(
              "text-[10px] tracking-widest uppercase px-4 py-2 border",
              validationError
                ? "border-[#333333] text-[#444444] cursor-not-allowed"
                : "border-[#c9a962] text-[#c9a962] hover:bg-[#c9a962] hover:text-[#0a0a0a] transition-colors duration-150",
            )}
          >
            Confirm Split
          </button>
        </div>
      </div>
    </div>
  );
}
