import React from 'react';

const TipCard = ({ tips, title = "Financial Tips" }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <h3 className="font-semibold text-lg mb-3 text-slate-900">{title}</h3>
      <div className="space-y-2">
        {tips && tips.length > 0 ? (
          tips.map((tip, idx) => (
            <div key={idx} className="flex items-start p-2 bg-yellow-50 rounded border-l-4 border-orange_peel-500">
              <span className="text-sm text-slate-700">{tip}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600">No tips available yet. Start tracking expenses!</p>
        )}
      </div>
    </div>
  );
};

export default TipCard;
