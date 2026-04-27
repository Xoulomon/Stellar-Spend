export interface Dispute {
  id: string;
  transactionId: string;
  userAddress: string;
  reason: string;
  description?: string;
  status: 'open' | 'in_review' | 'resolved' | 'rejected';
  createdAt: number;
  updatedAt: number;
  resolvedAt?: number;
  resolutionNotes?: string;
}

export interface CreateDisputeRequest {
  transactionId: string;
  reason: string;
  description?: string;
}

export interface DisputeUpdate {
  status?: 'open' | 'in_review' | 'resolved' | 'rejected';
  resolutionNotes?: string;
}
