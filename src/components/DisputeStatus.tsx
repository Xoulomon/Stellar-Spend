'use client';

import { Dispute } from '@/types/disputes';

interface DisputeStatusProps {
  dispute: Dispute;
}

export function DisputeStatus({ dispute }: DisputeStatusProps) {
  const statusColors: Record<string, string> = {
    open: 'bg-yellow-100 text-yellow-800',
    in_review: 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  const statusLabels: Record<string, string> = {
    open: 'Open',
    in_review: 'In Review',
    resolved: 'Resolved',
    rejected: 'Rejected',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Status</span>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[dispute.status]}`}>
          {statusLabels[dispute.status]}
        </span>
      </div>

      <div>
        <span className="text-sm font-medium">Reason</span>
        <p className="text-sm text-gray-600">{dispute.reason}</p>
      </div>

      {dispute.description && (
        <div>
          <span className="text-sm font-medium">Description</span>
          <p className="text-sm text-gray-600">{dispute.description}</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Created: {new Date(dispute.createdAt).toLocaleString()}
      </div>

      {dispute.resolutionNotes && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <span className="text-sm font-medium">Resolution Notes</span>
          <p className="text-sm text-gray-600">{dispute.resolutionNotes}</p>
        </div>
      )}
    </div>
  );
}
