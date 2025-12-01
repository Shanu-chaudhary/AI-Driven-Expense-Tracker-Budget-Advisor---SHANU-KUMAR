import React from 'react';

const ForecastChart = ({ forecast = {} }) => {
  const categories = Object.keys(forecast);
  const maxValue = Math.max(...Object.values(forecast).map(v => Number(v) || 0), 1);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-lg mb-4">Next Month Forecast</h3>
      
      {categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700 capitalize">{category}</span>
                <span className="font-semibold text-gray-900">₹{forecast[category]?.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div
                  className="bg-orange_peel-500 h-2 rounded transition-all"
                  style={{ width: `${(forecast[category] / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No forecast data available</p>
      )}
    </div>
  );
};

export default ForecastChart;
