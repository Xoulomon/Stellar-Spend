"use client";

import { useClipboard } from "@/hooks/useClipboard";
import { useToast } from "@/contexts/ToastContext";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export function CopyButton({ text, label = "Copy", className = "" }: CopyButtonProps) {
  const { isCopied, copy } = useClipboard();
  const { showToast } = useToast();

  const handleCopy = async () => {
    const success = await copy(text);
    if (success) {
      showToast("Copied to clipboard", "success");
    } else {
      showToast("Failed to copy", "error");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs border border-line hover:border-accent transition-colors rounded ${className}`}
      aria-label={`${label}: ${text}`}
      title={isCopied ? "Copied!" : "Copy to clipboard"}
    >
      {isCopied ? (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-accent">
          <path
            d="M13.5 4.5L6 12L2.5 8.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <rect
            x="5.5"
            y="5.5"
            width="8"
            height="8"
            stroke="currentColor"
            strokeWidth="1.5"
            rx="1"
          />
          <path
            d="M3.5 10.5H2.5C1.94772 10.5 1.5 10.0523 1.5 9.5V2.5C1.5 1.94772 1.94772 1.5 2.5 1.5H9.5C10.0523 1.5 10.5 1.94772 10.5 2.5V3.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      )}
      <span>{isCopied ? "Copied" : label}</span>
    </button>
  );
}
