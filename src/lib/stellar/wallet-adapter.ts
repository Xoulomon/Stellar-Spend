import * as freighterApi from "@stellar/freighter-api";

export type WalletType = "freighter" | "lobstr";

export interface StellarWallet {
  readonly type: WalletType;
  readonly publicKey: string;
  readonly isConnected: boolean;
}

const MAINNET_PASSPHRASE = "Public Global Stellar Network ; September 2015";

// ── Error helpers ──────────────────────────────────────────────────────────────

function friendlyError(raw: unknown, fallback: string): Error {
  if (!raw) return new Error(fallback);
  if (typeof raw === "object" && "message" in raw) {
    const msg = String((raw as { message: unknown }).message ?? "");
    if (/user declined|rejected|denied/i.test(msg))
      return new Error(
        "Connection request was declined. Please approve it in your wallet and try again."
      );
    if (/not connected|not installed/i.test(msg))
      return new Error(
        "Wallet extension is not installed or unavailable. Please install it and try again."
      );
    if (/timeout/i.test(msg))
      return new Error("The wallet did not respond in time. Please try again.");
    if (msg) return new Error(msg);
  }
  return new Error(fallback);
}

// ── Lobstr provider interface ──────────────────────────────────────────────────

interface LobstrProvider {
  connect(): Promise<{ publicKey: string }>;
  signTransaction(
    xdr: string,
    opts: { networkPassphrase: string }
  ): Promise<{ signedXdr: string }>;
}

function resolveLobstrProvider(): LobstrProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const candidate: unknown = w.lobstr ?? (w.stellar?.isLobstr ? w.stellar : null);
  if (!candidate || typeof candidate !== "object") return null;
  if (
    typeof (candidate as any).connect !== "function" ||
    typeof (candidate as any).signTransaction !== "function"
  ) {
    return null;
  }
  return candidate as LobstrProvider;
}

// ── Adapter ────────────────────────────────────────────────────────────────────

export class StellarWalletAdapter {
  private _walletType: WalletType | null = null;
  private _publicKey: string | null = null;

  // Serialises concurrent connection calls across both connectAuto,
  // connectFreighter, and connectLobstr.
  private _connectingPromise: Promise<StellarWallet> | null = null;

  // ── Availability ──────────────────────────────────────────────────────────────

  async isFreighterAvailable(): Promise<boolean> {
    try {
      if (typeof window !== "undefined" && (window as any).freighter) return true;
      const result = await freighterApi.isConnected();
      return !result.error && result.isConnected !== undefined;
    } catch {
      return false;
    }
  }

  isLobstrAvailable(): boolean {
    return resolveLobstrProvider() !== null;
  }

  // ── Freighter connection ──────────────────────────────────────────────────────

  connectFreighter(): Promise<StellarWallet> {
    if (this._walletType === "freighter" && this._publicKey) {
      return Promise.resolve({
        type: "freighter",
        publicKey: this._publicKey,
        isConnected: true,
      });
    }
    if (this._connectingPromise) return this._connectingPromise;
    this._connectingPromise = this._doConnectFreighter().finally(() => {
      this._connectingPromise = null;
    });
    return this._connectingPromise;
  }

  private async _doConnectFreighter(): Promise<StellarWallet> {
    const available = await this.isFreighterAvailable();
    if (!available) {
      throw new Error(
        "Freighter extension is not installed. Visit https://freighter.app to install it."
      );
    }

    const connectedResult = await freighterApi.isConnected();
    if (connectedResult.error) {
      throw friendlyError(
        connectedResult.error,
        "Could not reach Freighter. Please try again."
      );
    }

    if (connectedResult.isConnected) {
      const addressResult = await freighterApi.getAddress();
      if (!addressResult.error && addressResult.address) {
        return this._store("freighter", addressResult.address);
      }
    }

    const accessResult = await freighterApi.requestAccess();
    if (accessResult.error) {
      throw friendlyError(
        accessResult.error,
        "Freighter access was denied. Please approve the connection request and try again."
      );
    }
    if (accessResult.address) {
      return this._store("freighter", accessResult.address);
    }

    const retryResult = await freighterApi.getAddress();
    if (retryResult.error) {
      throw friendlyError(
        retryResult.error,
        "Connected to Freighter but could not retrieve your public key. Please try again."
      );
    }
    if (!retryResult.address) {
      throw new Error(
        "Connected to Freighter but no public key was returned. " +
          "Ensure your wallet is unlocked and try again."
      );
    }
    return this._store("freighter", retryResult.address);
  }

  // ── Lobstr connection ─────────────────────────────────────────────────────────

  connectLobstr(): Promise<StellarWallet> {
    if (this._walletType === "lobstr" && this._publicKey) {
      return Promise.resolve({
        type: "lobstr",
        publicKey: this._publicKey,
        isConnected: true,
      });
    }
    if (this._connectingPromise) return this._connectingPromise;
    this._connectingPromise = this._doConnectLobstr().finally(() => {
      this._connectingPromise = null;
    });
    return this._connectingPromise;
  }

  private async _doConnectLobstr(): Promise<StellarWallet> {
    const provider = resolveLobstrProvider();
    if (!provider) {
      throw new Error(
        "Lobstr wallet is not installed or unavailable. " +
          "Visit https://lobstr.co to install it."
      );
    }

    let result: { publicKey: string };
    try {
      result = await provider.connect();
    } catch (err: unknown) {
      throw friendlyError(err, "Failed to connect to Lobstr. Please try again.");
    }

    if (!result || typeof result !== "object") {
      throw new Error("Lobstr returned an unexpected response. Please try again.");
    }

    const publicKey = (result as any).publicKey;
    if (typeof publicKey !== "string" || publicKey.trim() === "") {
      throw new Error(
        "Lobstr did not return a valid public key. " +
          "Ensure your wallet is unlocked and try again."
      );
    }

    return this._store("lobstr", publicKey.trim());
  }

  // ── connectAuto ───────────────────────────────────────────────────────────────

  /**
   * Attempts Freighter first. If the extension is not installed or unavailable,
   * falls back to Lobstr. Throws a clear, user-friendly error if neither wallet
   * is present.
   *
   * Idempotent: returns the stored wallet immediately if already connected.
   * Race-condition safe: concurrent calls share one in-flight promise.
   */
  connectAuto(): Promise<StellarWallet> {
    // Already connected — return immediately without any provider calls.
    if (this._walletType && this._publicKey) {
      return Promise.resolve({
        type: this._walletType,
        publicKey: this._publicKey,
        isConnected: true,
      });
    }

    // Collapse concurrent calls.
    if (this._connectingPromise) return this._connectingPromise;

    this._connectingPromise = this._doConnectAuto().finally(() => {
      this._connectingPromise = null;
    });
    return this._connectingPromise;
  }

  private async _doConnectAuto(): Promise<StellarWallet> {
    // Try Freighter first.
    if (await this.isFreighterAvailable()) {
      return this._doConnectFreighter();
    }

    // Fall back to Lobstr.
    if (this.isLobstrAvailable()) {
      return this._doConnectLobstr();
    }

    throw new Error(
      "No Stellar wallet found. Please install Freighter (https://freighter.app) " +
        "or Lobstr (https://lobstr.co)."
    );
  }

  // ── signTransaction ───────────────────────────────────────────────────────────

  /**
   * Routes signing to the correct provider based on the stored walletType.
   *
   * Freighter: uses freighterApi.signTransaction with the mainnet passphrase.
   * Lobstr: re-resolves the provider at call time (handles mid-session removal),
   *         calls signTransaction with the mainnet passphrase.
   *
   * Always enforces the mainnet network passphrase.
   * Throws descriptive errors for: no wallet connected, provider unavailable,
   * user rejection, and empty/invalid signed XDR.
   */
  async signTransaction(xdr: string): Promise<string> {
    if (!this._walletType || !this._publicKey) {
      throw new Error("No wallet connected. Please connect your wallet first.");
    }

    if (this._walletType === "freighter") {
      return this._signWithFreighter(xdr);
    }

    return this._signWithLobstr(xdr);
  }

  private async _signWithFreighter(xdr: string): Promise<string> {
    const result = await freighterApi.signTransaction(xdr, {
      networkPassphrase: MAINNET_PASSPHRASE,
    });

    if (result.error) {
      throw friendlyError(result.error, "Transaction signing failed. Please try again.");
    }
    if (!result.signedTxXdr) {
      throw new Error(
        "Freighter returned an empty signed transaction. Please try again."
      );
    }
    return result.signedTxXdr;
  }

  private async _signWithLobstr(xdr: string): Promise<string> {
    // Re-resolve at call time — the provider may have been removed mid-session.
    const provider = resolveLobstrProvider();
    if (!provider) {
      throw new Error(
        "Lobstr is no longer available. Please reconnect your wallet."
      );
    }

    let signResult: { signedXdr: string };
    try {
      signResult = await provider.signTransaction(xdr, {
        networkPassphrase: MAINNET_PASSPHRASE,
      });
    } catch (err: unknown) {
      throw friendlyError(err, "Transaction signing failed. Please try again.");
    }

    if (!signResult?.signedXdr) {
      throw new Error(
        "Lobstr returned an empty signed transaction. Please try again."
      );
    }
    return signResult.signedXdr;
  }

  // ── State accessors ───────────────────────────────────────────────────────────

  getWallet(): StellarWallet | null {
    if (!this._walletType || !this._publicKey) return null;
    return { type: this._walletType, publicKey: this._publicKey, isConnected: true };
  }

  disconnect(): void {
    this._walletType = null;
    this._publicKey = null;
    this._connectingPromise = null;
  }

  // ── Private helpers ───────────────────────────────────────────────────────────

  private _store(type: WalletType, publicKey: string): StellarWallet {
    this._walletType = type;
    this._publicKey = publicKey;
    return { type, publicKey, isConnected: true };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let _adapter: StellarWalletAdapter | null = null;

export function getStellarWalletAdapter(): StellarWalletAdapter {
  if (!_adapter) _adapter = new StellarWalletAdapter();
  return _adapter;
}

/** Resets the singleton — test isolation only, never call in production. */
export function _resetAdapterSingleton(): void {
  _adapter = null;
}
