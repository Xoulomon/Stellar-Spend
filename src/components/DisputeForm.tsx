'use client';

import { useState } from 'react';
import { CreateDisputeRequest } from '@/types/disputes';

interface DisputeFormProps {
  transactionId: string;
  onSubmit: (data: CreateDisputeRequest) => Promise<void>;
  onCancel?: () => void;
}

export function DisputeForm({ transactionId, onSubmit, onCancel }: DisputeFormProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reasons = [
    'Funds not received',
    'Incorrect amount',
    'Wrong recipient',
    'Duplicate transaction',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await onSubmit({
        transactionId,
        reason,
        description: description || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Dispute Reason *</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Select a reason</option>
          {reasons.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide additional details about the dispute..."
          rows={4}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!reason || loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Dispute'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 border rounded-lg"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
