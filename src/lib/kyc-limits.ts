import crypto from 'crypto';

export type KYCStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type LimitTier = 'tier1' | 'tier2' | 'tier3';

export interface KYCData {
  userId: string;
  status: KYCStatus;
  documentType: string;
  documentId: string;
  submittedAt: number;
  verifiedAt?: number;
  rejectionReason?: string;
}

export interface TransactionLimit {
  tier: LimitTier;
  dailyLimit: number;
  monthlyLimit: number;
  transactionLimit: number;
}

export interface UserLimits {
  userId: string;
  tier: LimitTier;
  dailyUsed: number;
  monthlyUsed: number;
  dailyResetAt: number;
  monthlyResetAt: number;
  limitIncreaseRequests: LimitIncreaseRequest[];
}

export interface LimitIncreaseRequest {
  id: string;
  userId: string;
  requestedTier: LimitTier;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  reviewedAt?: number;
}

const TIER_LIMITS: Record<LimitTier, TransactionLimit> = {
  tier1: { dailyLimit: 1000, monthlyLimit: 10000, transactionLimit: 500 },
  tier2: { dailyLimit: 5000, monthlyLimit: 50000, transactionLimit: 2500 },
  tier3: { dailyLimit: 50000, monthlyLimit: 500000, transactionLimit: 25000 },
};

export class KYCLimitService {
  private static readonly KYC_STORAGE_KEY = 'stellar_spend_kyc';
  private static readonly LIMITS_STORAGE_KEY = 'stellar_spend_limits';

  static submitKYC(userId: string, documentType: string, documentId: string): KYCData {
    const kyc: KYCData = {
      userId,
      status: 'pending',
      documentType,
      documentId,
      submittedAt: Date.now(),
    };

    const kycMap = this.getAllKYC();
    kycMap[userId] = kyc;
    this.persistKYC(kycMap);
    return kyc;
  }

  static getKYC(userId: string): KYCData | null {
    const kycMap = this.getAllKYC();
    return kycMap[userId] || null;
  }

  static verifyKYC(userId: string): KYCData | null {
    const kyc = this.getKYC(userId);
    if (!kyc) return null;

    kyc.status = 'verified';
    kyc.verifiedAt = Date.now();

    const kycMap = this.getAllKYC();
    kycMap[userId] = kyc;
    this.persistKYC(kycMap);

    // Upgrade to tier2 on verification
    this.initializeUserLimits(userId, 'tier2');
    return kyc;
  }

  static rejectKYC(userId: string, reason: string): KYCData | null {
    const kyc = this.getKYC(userId);
    if (!kyc) return null;

    kyc.status = 'rejected';
    kyc.rejectionReason = reason;

    const kycMap = this.getAllKYC();
    kycMap[userId] = kyc;
    this.persistKYC(kycMap);
    return kyc;
  }

  static initializeUserLimits(userId: string, tier: LimitTier = 'tier1'): UserLimits {
    const now = Date.now();
    const limits: UserLimits = {
      userId,
      tier,
      dailyUsed: 0,
      monthlyUsed: 0,
      dailyResetAt: now + 86400000,
      monthlyResetAt: now + 2592000000,
      limitIncreaseRequests: [],
    };

    const limitsMap = this.getAllLimits();
    limitsMap[userId] = limits;
    this.persistLimits(limitsMap);
    return limits;
  }

  static getUserLimits(userId: string): UserLimits | null {
    const limitsMap = this.getAllLimits();
    return limitsMap[userId] || null;
  }

  static canTransact(userId: string, amount: number): { allowed: boolean; reason?: string } {
    const limits = this.getUserLimits(userId);
    if (!limits) return { allowed: false, reason: 'User limits not initialized' };

    const tierLimit = TIER_LIMITS[limits.tier];
    const now = Date.now();

    // Reset if needed
    if (now > limits.dailyResetAt) {
      limits.dailyUsed = 0;
      limits.dailyResetAt = now + 86400000;
    }
    if (now > limits.monthlyResetAt) {
      limits.monthlyUsed = 0;
      limits.monthlyResetAt = now + 2592000000;
    }

    if (amount > tierLimit.transactionLimit) {
      return { allowed: false, reason: `Transaction exceeds limit of ${tierLimit.transactionLimit}` };
    }
    if (limits.dailyUsed + amount > tierLimit.dailyLimit) {
      return { allowed: false, reason: `Daily limit exceeded` };
    }
    if (limits.monthlyUsed + amount > tierLimit.monthlyLimit) {
      return { allowed: false, reason: `Monthly limit exceeded` };
    }

    return { allowed: true };
  }

  static recordTransaction(userId: string, amount: number): void {
    const limits = this.getUserLimits(userId);
    if (!limits) return;

    limits.dailyUsed += amount;
    limits.monthlyUsed += amount;

    const limitsMap = this.getAllLimits();
    limitsMap[userId] = limits;
    this.persistLimits(limitsMap);
  }

  static requestLimitIncrease(userId: string, requestedTier: LimitTier): LimitIncreaseRequest {
    const request: LimitIncreaseRequest = {
      id: crypto.randomUUID(),
      userId,
      requestedTier,
      status: 'pending',
      createdAt: Date.now(),
    };

    const limits = this.getUserLimits(userId);
    if (limits) {
      limits.limitIncreaseRequests.push(request);
      const limitsMap = this.getAllLimits();
      limitsMap[userId] = limits;
      this.persistLimits(limitsMap);
    }

    return request;
  }

  static approveLimitIncrease(userId: string, requestId: string): boolean {
    const limits = this.getUserLimits(userId);
    if (!limits) return false;

    const request = limits.limitIncreaseRequests.find(r => r.id === requestId);
    if (!request) return false;

    request.status = 'approved';
    request.reviewedAt = Date.now();
    limits.tier = request.requestedTier;

    const limitsMap = this.getAllLimits();
    limitsMap[userId] = limits;
    this.persistLimits(limitsMap);
    return true;
  }

  private static getAllKYC(): Record<string, KYCData> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(this.KYC_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static getAllLimits(): Record<string, UserLimits> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(this.LIMITS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static persistKYC(kycMap: Record<string, KYCData>): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.KYC_STORAGE_KEY, JSON.stringify(kycMap));
    }
  }

  private static persistLimits(limitsMap: Record<string, UserLimits>): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.LIMITS_STORAGE_KEY, JSON.stringify(limitsMap));
    }
  }
}
