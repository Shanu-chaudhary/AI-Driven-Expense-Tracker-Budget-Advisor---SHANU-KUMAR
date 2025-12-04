import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const AiAdviceModal = ({ isOpen, onClose, onGenerate, loading = false }) => {
  const [scope, setScope] = useState('monthly');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold mb-4 bp-gradient-text">Generate AI Advice</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Analysis Scope</label>
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="w-full border border-blue-200 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-slate-900"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="detailed">Detailed Analysis</option>
          </select>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={() => onGenerate(scope)} disabled={loading}>{loading ? 'Generating...' : 'Generate'}</Button>
        </div>
      </Card>
    </div>
  );
};

export default AiAdviceModal;
