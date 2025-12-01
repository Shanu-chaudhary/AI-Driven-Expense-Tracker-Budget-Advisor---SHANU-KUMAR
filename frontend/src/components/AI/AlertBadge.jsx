import React from 'react';

const AlertBadge = ({ alert }) => {
  const typeColors = {
    spending_spike: 'bg-red-100 text-red-800 border-red-300',
    budget_warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    savings_goal: 'bg-green-100 text-green-800 border-green-300',
    default: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const color = typeColors[alert?.type] || typeColors.default;

  return (
    <div className={`border rounded-lg p-3 mb-2 ${color}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="font-medium text-sm">{alert?.type?.replace('_', ' ').toUpperCase()}</p>
          <p className="text-sm mt-1">{alert?.message}</p>
        </div>
        {!alert?.isRead && <span className="px-2 py-1 bg-current bg-opacity-20 rounded text-xs font-semibold ml-2">NEW</span>}
      </div>
    </div>
  );
};

export default AlertBadge;
