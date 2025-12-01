import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AiHistoryCard from '../components/AI/AiHistoryCard';
import axios from '../api/axios';
import { ToastContext } from '../context/ToastContext';

const AiHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/ai/history');
      if (res.data?.history) {
        setHistory(res.data.history);
      }
    } catch (e) {
      addToast('Failed to load history: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Advice History</h1>
          <p className="text-gray-600 mt-1">Review all your AI-generated financial advice</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* History List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading history...</p>
              </div>
            ) : history.length > 0 ? (
              <div>
                {history.map((entry) => (
                  <AiHistoryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelectedEntry(entry)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No AI advice history yet. Generate some advice to get started!</p>
              </div>
            )}
          </div>

          {/* Detail View */}
          <div className="lg:col-span-1">
            {selectedEntry ? (
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Details</h3>
                
                <div className="space-y-4">
                  {/* Scope */}
                  <div>
                    <p className="text-sm text-gray-600">Scope</p>
                    <p className="font-medium text-gray-900 capitalize">{selectedEntry.scope}</p>
                  </div>

                  {/* Generated Date */}
                  <div>
                    <p className="text-sm text-gray-600">Generated</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedEntry.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="border-t pt-4">
                    <p className="text-sm text-gray-600 mb-2">Summary</p>
                    <p className="text-sm text-gray-900">{selectedEntry.summary}</p>
                  </div>

                  {/* Savings */}
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Est. Savings Next Month</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{selectedEntry.estimatedSavingsNextMonth?.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Confidence */}
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-600">Confidence Score</p>
                    <div className="flex items-center mt-1">
                      <div className="flex-1 bg-gray-200 rounded h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded"
                          style={{ width: `${selectedEntry.confidenceScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-blue-600">{selectedEntry.confidenceScore}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {selectedEntry.actions?.length > 0 && (
                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-600 mb-2">Recommended Actions</p>
                      <ul className="space-y-1">
                        {selectedEntry.actions.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-4 text-center py-8">
                <p className="text-gray-600">Select an entry to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AiHistory;
