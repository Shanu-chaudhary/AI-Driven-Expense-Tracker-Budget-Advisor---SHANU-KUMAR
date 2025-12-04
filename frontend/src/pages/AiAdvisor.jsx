import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AiAdviceModal from '../components/AI/AiAdviceModal';
import TipCard from '../components/Tips/TipCard';
import axios from '../api/axios';
import { ToastContext } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const AiAdvisor = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [txns, setTxns] = useState([]);
  const [computedAnalysis, setComputedAnalysis] = useState(null);
  const { addToast } = useContext(ToastContext);

  useEffect(() => {
    fetchTips();
    fetchTransactionsAndCompute();
  }, []);

  const fetchTips = async () => {
    try {
      const res = await axios.get('/tips/recommend');
      if (res.data) {
        setTips(res.data.tips || []);
        setAnalysis(res.data.analysis);
      }
    } catch (e) {
      console.warn('Failed to fetch tips:', e.message);
    }
  };

  const fetchTransactionsAndCompute = async () => {
    try {
      const res = await axios.get('/transactions/list');
      const allTxns = Array.isArray(res.data) ? res.data : (res.data?.transactions || []);
      setTxns(allTxns);

      // compute last 3 months totals
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1); // include current month and two previous
      let totalIncome = 0;
      let totalExpense = 0;

      allTxns.forEach((t) => {
        const date = t.date ? new Date(t.date) : null;
        if (!date) return;
        if (date >= threeMonthsAgo) {
          const amt = Number(t.amount) || 0;
          const cat = (t.category || '').toString().toLowerCase();
          if ((t.type || '').toString().toLowerCase() === 'income' || cat === 'income') {
            totalIncome += Math.abs(amt);
          } else {
            totalExpense += Math.abs(amt);
          }
        }
      });

      const savingRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
      setComputedAnalysis({ totalExpense, totalIncome, savingRate });
    } catch (e) {
      console.warn('Failed to fetch transactions:', e.message);
    }
  };

  const generateAdvice = async (scope) => {
    setLoading(true);
    try {
      const res = await axios.post('/ai/advice', { scope });
      if (res.data) {
        setAdvice(res.data);
        addToast('Advice generated successfully!', 'success');
        setIsModalOpen(false);
      }
    } catch (e) {
      addToast('Failed to generate advice: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bp-gradient-text">AI Budget Advisor</h1>
          <p className="text-slate-600 mt-1">Get personalized financial advice powered by AI</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Advice Column */}
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-slate-900">AI-Powered Advice</h2>
                <Button onClick={() => setIsModalOpen(true)}>Generate Advice</Button>
              </div>

              {advice ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <Card className="p-4 bg-blue-50 border-l-4 border-blue-400">
                    <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
                    <p className="text-slate-700">{advice.summary}</p>
                  </Card>

                  {/* Estimated Savings */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <p className="text-sm text-slate-600">Estimated Savings Next Month</p>
                      <p className="text-2xl font-bold text-green-600">₹{advice.estimatedSavingsNextMonth?.toLocaleString('en-IN')}</p>
                    </Card>
                    <Card className="p-4">
                      <p className="text-sm text-slate-600">Confidence Score</p>
                      <p className="text-2xl font-bold text-blue-600">{advice.confidenceScore}%</p>
                    </Card>
                  </div>

                  {/* Actions */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Recommended Actions</h3>
                    <ul className="space-y-2">
                      {advice.actions?.map((action, idx) => (
                        <li key={idx} className="flex items-start text-slate-700">
                          <span className="inline-block w-6 h-6 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full text-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0 flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="ghost" onClick={() => setIsModalOpen(true)}>Regenerate Advice</Button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-600 mb-4">No advice generated yet</p>
                  <Button onClick={() => setIsModalOpen(true)}>Generate Your First Advice</Button>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar - Tips */}
          <div className="lg:col-span-1">
            <TipCard tips={tips} title="Rule-Based Tips" />
            {(computedAnalysis || analysis) && (
              <Card className="p-4 mt-4">
                <h3 className="font-semibold mb-3 text-slate-900">Spending Analysis</h3>
                <div className="space-y-2 text-sm">
                  { (computedAnalysis?.savingRate ?? analysis?.savingRate) !== undefined && (
                    <div>
                      <p className="text-slate-600">Saving Rate</p>
                      <p className="font-bold text-lg text-slate-900">{((computedAnalysis?.savingRate ?? analysis?.savingRate) || 0).toFixed(1)}%</p>
                    </div>
                  )}
                  { (computedAnalysis?.totalExpense ?? analysis?.totalExpense) !== undefined && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-slate-600">Total Expense (3 months)</p>
                      <p className="font-bold text-lg text-slate-900">₹{Math.round((computedAnalysis?.totalExpense ?? analysis?.totalExpense) || 0).toLocaleString('en-IN')}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <AiAdviceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={generateAdvice}
        loading={loading}
      />
    </DashboardLayout>
  );
};

export default AiAdvisor;
