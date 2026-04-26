'use client';

import { useState, useEffect } from 'react';
import { TemplateStorage, TransactionTemplate } from '@/lib/transaction-templates';
import { Button } from '@/components/design-system/Button';
import { Card } from '@/components/design-system/Card';

interface TemplateManagerProps {
  onSelectTemplate?: (template: TransactionTemplate) => void;
}

export function TemplateManager({ onSelectTemplate }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    currency: 'NGN',
    feeMethod: 'USDC' as const,
  });

  useEffect(() => {
    setTemplates(TemplateStorage.getAllTemplates());
  }, []);

  const handleSave = () => {
    if (!formData.name || !formData.amount) return;

    if (editingId) {
      TemplateStorage.updateTemplate(editingId, formData);
      setEditingId(null);
    } else {
      TemplateStorage.createTemplate(formData);
    }

    setTemplates(TemplateStorage.getAllTemplates());
    setFormData({ name: '', amount: '', currency: 'NGN', feeMethod: 'USDC' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    TemplateStorage.deleteTemplate(id);
    setTemplates(TemplateStorage.getAllTemplates());
  };

  const handleUseTemplate = (template: TransactionTemplate) => {
    TemplateStorage.recordUsage(template.id);
    onSelectTemplate?.(template);
  };

  const handleEdit = (template: TransactionTemplate) => {
    setFormData({
      name: template.name,
      amount: template.amount,
      currency: template.currency,
      feeMethod: template.feeMethod,
    });
    setEditingId(template.id);
    setShowForm(true);
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Transaction Templates</h3>

      {templates.length > 0 && (
        <div className="space-y-2 mb-4">
          {templates.map(t => (
            <div key={t.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
              <div className="flex-1">
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-gray-600">{t.amount} {t.currency}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleUseTemplate(t)} size="sm">Use</Button>
                <Button onClick={() => handleEdit(t)} variant="secondary" size="sm">Edit</Button>
                <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:text-red-800 px-2">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Template Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Amount"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: e.target.value })}
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
          <select
            value={formData.feeMethod}
            onChange={e => setFormData({ ...formData, feeMethod: e.target.value as 'XLM' | 'USDC' })}
            className="w-full p-2 border rounded"
          >
            <option value="USDC">USDC Fee</option>
            <option value="XLM">XLM Fee</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={handleSave}>{editingId ? 'Update' : 'Create'}</Button>
            <Button onClick={() => { setShowForm(false); setEditingId(null); }} variant="secondary">Cancel</Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setShowForm(true)}>New Template</Button>
      )}
    </Card>
  );
}
