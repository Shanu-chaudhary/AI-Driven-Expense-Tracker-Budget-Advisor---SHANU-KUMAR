import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import AiAdviceModal from '../components/AI/AiAdviceModal';
import TipCard from '../components/Tips/TipCard';
import axios from '../api/axios';
import { ToastContext } from '../context/ToastContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useLocation } from 'react-router-dom';

const AiAdvisor = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adviceMonthly, setAdviceMonthly] = useState(null);
  const [adviceAll, setAdviceAll] = useState(null);
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisType, setAnalysisType] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [txns, setTxns] = useState([]);
  const [computedAnalysis, setComputedAnalysis] = useState(null);
  const { addToast } = useContext(ToastContext);
  const location = useLocation();

  useEffect(() => {
    fetchTips();
    fetchTransactionsAndCompute();
    // auto-generate if navigated from insights
    if (location?.state?.prefillFrom === 'insights') {
      // generate monthly first, then full history
      generateAdvice('monthly');
      setTimeout(() => generateAdvice('all'), 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
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
    setAnalysisType(scope);
    try {
      const res = await axios.post('/ai/advice', { scope });
      if (res.data) {
        if (scope === 'monthly') setAdviceMonthly(res.data);
        else if (scope === 'all') setAdviceAll(res.data);
        addToast(`${scope === 'monthly' ? 'Monthly' : 'All Transactions'} analysis completed!`, 'success');
        setIsModalOpen(false);
      }
    } catch (e) {
      addToast('Failed to generate advice: ' + (e.response?.data?.error || e.message), 'error');
    } finally {
      setLoading(false);
      setAnalysisType(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bp-gradient-text">AI Budget Advisor</h1>
          <p className="text-slate-600 mt-1">Get personalized financial advice powered by AI</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">AI-Powered Advice</h2>
                  <p className="text-sm text-slate-600">Choose analysis type or generate both</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} disabled={loading}>Generate</Button>
              </div>

              {loading && (
                <div className="mb-4">
                  <Card className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                      <div className="text-sm text-slate-700">AI is Analyzing... {analysisType === 'monthly' ? '(monthly)' : analysisType === 'all' ? '(all transactions)' : ''}</div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Monthly Analysis */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold">Monthly Analysis</h3>
                {adviceMonthly ? (
                  <div className="mt-3 space-y-4">
                    <Card className="p-4 bg-blue-50 border-l-4 border-blue-400">
                      <h4 className="font-semibold">Summary</h4>
                      <p className="text-slate-700">{adviceMonthly.summary}</p>
                    </Card>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <p className="text-sm text-slate-600">Estimated Savings</p>
                        <p className="text-2xl font-bold text-green-600">₹{adviceMonthly.estimatedSavingsNextMonth?.toLocaleString('en-IN')}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-slate-600">Confidence</p>
                        <p className="text-2xl font-bold text-blue-600">{adviceMonthly.confidenceScore}%</p>
                      </Card>
                    </div>
                    <div>
                      <h4 className="font-semibold">Actions</h4>
                      <ul className="mt-2 space-y-2">
                        {adviceMonthly.actions?.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-700">
                            <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 mt-3">No monthly analysis yet.</div>
                )}
              </div>

              {/* All Transactions Analysis */}
              <div>
                <h3 className="text-lg font-semibold">All Transactions Analysis</h3>
                {adviceAll ? (
                  <div className="mt-3 space-y-4">
                    <Card className="p-4 bg-purple-50 border-l-4 border-purple-400">
                      <h4 className="font-semibold">Summary</h4>
                      <p className="text-slate-700">{adviceAll.summary}</p>
                    </Card>
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="p-4">
                        <p className="text-sm text-slate-600">Total Savings Potential</p>
                        <p className="text-2xl font-bold text-green-600">₹{adviceAll.estimatedSavingsNextMonth?.toLocaleString('en-IN')}</p>
                      </Card>
                      <Card className="p-4">
                        <p className="text-sm text-slate-600">Confidence</p>
                        <p className="text-2xl font-bold text-purple-600">{adviceAll.confidenceScore}%</p>
                      </Card>
                    </div>
                    <div>
                      <h4 className="font-semibold">Long-Term Actions</h4>
                      <ul className="mt-2 space-y-2">
                        {adviceAll.actions?.map((a, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-700">
                            <span className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-600 mt-3">No full-history analysis yet.</div>
                )}
              </div>
            </Card>
          </div>

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
