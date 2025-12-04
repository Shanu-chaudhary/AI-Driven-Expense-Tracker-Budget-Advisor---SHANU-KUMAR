import React from 'react';
import Card from '../ui/Card';

const AiHistoryCard = ({ entry, onClick }) => {
  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-IN', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'N/A';
    }
  };

  return (
    <Card className="mb-3 cursor-pointer hover:shadow-lg transition" onClick={onClick}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className="inline-block px-2 py-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-700 text-xs rounded font-semibold mb-2">
            {entry?.scope?.toUpperCase()}
          </span>
          <p className="text-sm text-slate-600 font-medium">Confidence: {entry?.confidenceScore}%</p>
          <p className="text-xs text-slate-500 mt-1">{formatDate(entry?.createdAt)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-green-600">
            ₹{entry?.estimatedSavingsNextMonth?.toLocaleString('en-IN')} savings
          </p>
        </div>
      </div>
      <p className="text-sm text-slate-700 mt-3 line-clamp-2">{entry?.summary}</p>
    </Card>
  );
};

export default AiHistoryCard;
