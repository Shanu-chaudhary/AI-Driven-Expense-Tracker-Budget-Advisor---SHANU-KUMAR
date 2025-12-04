import React from 'react';
import Card from '../ui/Card';

const ForecastChart = ({ forecast = {} }) => {
  const categories = Object.keys(forecast);
  const maxValue = Math.max(...Object.values(forecast).map(v => Number(v) || 0), 1);
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-4 bp-gradient-text">Next Month Forecast</h3>

      {categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600 capitalize">{category}</span>
                <span className="font-semibold text-slate-900">₹{forecast[category]?.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-blue-100 rounded h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded transition-all"
                  style={{ width: `${(forecast[category] / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">No forecast data available</p>
      )}
    </Card>
  );
};

export default ForecastChart;
