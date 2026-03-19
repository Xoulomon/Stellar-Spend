"use client";

import { useState, useEffect, useCallback } from "react";
import { getStellarWalletAdapter, type StellarWallet, type WalletType } from "@/lib/stellar/wallet-adapter";

export function useStellarWallet() {
  const [wallet, setWallet] = useState<StellarWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adapter = getStellarWalletAdapter();

  useEffect(() => {
    const existing = adapter.getWallet();
    if (existing) setWallet(existing);
  }, []);

  const connect = useCallback(async (walletType?: WalletType) => {
    setIsConnecting(true);
    setError(null);
    try {
      const connected =
        walletType === "freighter" ? await adapter.connectFreighter() :
        walletType === "lobstr" ? await adapter.connectLobstr() :
        await adapter.connectAuto();
      setWallet(connected);
      return connected;
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    adapter.disconnect();
    setWallet(null);
    setError(null);
  }, []);

  const signTransaction = useCallback(async (xdr: string): Promise<string> => {
    if (!wallet) throw new Error("No wallet connected");
    try {
      return await adapter.signTransaction(xdr);
    } catch (err: any) {
      setError(err.message || "Failed to sign transaction");
      throw err;
    }
  }, [wallet]);

  return { wallet, isConnected: !!wallet, isConnecting, error, connect, disconnect, signTransaction };
}
