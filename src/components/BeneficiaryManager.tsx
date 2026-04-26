'use client';

import { useState, useEffect } from 'react';
import { BeneficiaryStorage, SavedBeneficiary } from '@/lib/beneficiary-storage';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';

export function BeneficiaryManager() {
  const [beneficiaries, setBeneficiaries] = useState<SavedBeneficiary[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', accountNumber: '', bankCode: '', currency: 'NGN' });

  useEffect(() => {
    setBeneficiaries(BeneficiaryStorage.getAllBeneficiaries());
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.accountNumber || !formData.bankCode) return;
    BeneficiaryStorage.saveBeneficiary(formData);
    setBeneficiaries(BeneficiaryStorage.getAllBeneficiaries());
    setFormData({ name: '', accountNumber: '', bankCode: '', currency: 'NGN' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    BeneficiaryStorage.deleteBeneficiary(id);
    setBeneficiaries(Beneficiaries.getAllBeneficiaries());
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Saved Beneficiaries</h3>
      
      {beneficiaries.length > 0 && (
        <div className="space-y-2 mb-4">
          {beneficiaries.map(b => (
            <div key={b.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
              <div>
                <p className="font-medium">{b.name}</p>
                <p className="text-sm text-gray-600">{b.currency}</p>
              </div>
              <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:text-red-800">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Account Number"
            value={formData.accountNumber}
            onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Bank Code"
            value={formData.bankCode}
            onChange={e => setFormData({ ...formData, bankCode: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <select
            value={formData.currency}
            onChange={e => setFormData({ ...formData, currency: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="NGN">NGN</option>
            <option value="KES">KES</option>
            <option value="GHS">GHS</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button onClick={() => setShowForm(false)} variant="secondary">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)}>Add Beneficiary</Button>
      )}
    </Card>
  );
}
