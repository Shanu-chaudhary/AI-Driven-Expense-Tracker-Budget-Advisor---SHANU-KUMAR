import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const AiAdviceModal = ({ isOpen, onClose, onGenerate, loading = false }) => {
  const [scope, setScope] = useState('monthly');

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (loading) return;
    onGenerate(scope);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <Card className="max-w-lg w-full mx-4 p-6">
        <h2 className="text-xl font-semibold mb-4 bp-gradient-text">Generate AI Advice</h2>
        
        <p className="text-slate-600 text-sm mb-4">Choose the type of analysis you want:</p>

        <div className="mb-6 space-y-3">
          {/* Option 1: Monthly */}
          <div
            onClick={() => !loading && setScope('monthly')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              scope === 'monthly'
                ? 'border-blue-500 bg-blue-50'
                : 'border-blue-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                scope === 'monthly' ? 'border-blue-500 bg-blue-500' : 'border-blue-300'
              }`}>
                {scope === 'monthly' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className="font-semibold text-slate-900">Monthly Analysis</p>
                <p className="text-sm text-slate-600">Based on your current month's income & expenses</p>
              </div>
            </div>
          </div>

          {/* Option 2: All Transactions */}
          <div
            onClick={() => !loading && setScope('all')}
            className={`p-4 border-2 rounded-lg cursor-pointer transition ${
              scope === 'all'
                ? 'border-blue-500 bg-blue-50'
                : 'border-blue-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                scope === 'all' ? 'border-blue-500 bg-blue-500' : 'border-blue-300'
              }`}>
                {scope === 'all' && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className="font-semibold text-slate-900">All Transactions Analysis</p>
                <p className="text-sm text-slate-600">Analyze all your transaction history for insights</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="primary" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI is Analyzing...
              </span>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AiAdviceModal;
