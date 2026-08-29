import React, { useEffect, useState } from 'react';
import axios from '../api/axios';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import { useNavigate } from 'react-router-dom';
import { aggregateLifetimeTotals, aggregateCategoryBreakdown, aggregateMonthlyTrends, computeCategoryTrends, computeInsights, topSpendingTransactions } from '../utils/analytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import DashboardLayout from '../components/Layout/DashboardLayout';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

const formatCurrency = (v) => `₹${Number(v || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const KPI = ({ label, value, sub }) => (
  <div className="bg-white p-4 rounded shadow-sm border">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="text-xl font-bold mt-1">{value}</div>
    {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
  </div>
);

export default function Insights() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const [txRes, catRes] = await Promise.all([
          axios.get('/transactions').catch(() => ({ data: [] })),
          axios.get('/categories/list').catch(() => ({ data: [] })),
        ]);
        if (mounted) {
          setTransactions(txRes.data || []);
          setCategories(catRes.data || []);
        }
      } catch (e) {
        console.error('Failed to load transactions or categories for Insights', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => (mounted = false);
  }, []);

  const lifetime = aggregateLifetimeTotals(transactions);
  const cat = aggregateCategoryBreakdown(transactions);
  const monthly = aggregateMonthlyTrends(transactions);
  const catTrends = computeCategoryTrends(transactions, 8);
  const insights = computeInsights(transactions);
  const topTx = topSpendingTransactions(transactions, 10);

  // build quick lookup for category id -> name
  const categoryName = (raw) => {
    if (!raw) return 'Uncategorized';
    if (typeof raw === 'object') return raw.name || raw._id || raw.id || String(raw);
    const id = String(raw);
    const found = (categories || []).find((c) => (c._id || c.id) === id || c.id === id || c._id === id || c.name === id);
    if (found) return found.name;
    // maybe raw already a name
    const byName = (categories || []).find((c) => c.name === raw);
    if (byName) return byName.name;
    return id;
  };

  // Donut data
  const donut = {
    labels: cat.categories.map((c) => categoryName(c.category)),
    datasets: [
      {
        data: cat.categories.map((c) => c.total),
        backgroundColor: cat.categories.map((_, i) => {
          const palette = ['#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981', '#0288d1'];
          return palette[i % palette.length];
        }),
        hoverOffset: 6,
      },
    ],
  };

  // Monthly line chart data
  const months = monthly.map((m) => m.month);
  const lineData = {
    labels: months,
    datasets: [
      { label: 'Income', data: monthly.map((m) => m.income), borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', tension: 0.3 },
      { label: 'Expense', data: monthly.map((m) => m.expense), borderColor: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.06)', tension: 0.3 },
      { label: 'Savings', data: monthly.map((m) => m.savings), borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)', tension: 0.3 },
    ],
  };

  const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  const pctBadge = (v) => {
    const n = Number(v || 0);
    const positive = n > 0;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${positive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
        {positive ? '▲' : '▼'} {Math.abs(n).toFixed(1)}%
      </span>
    );
  };

  return (
    <DashboardLayout>
    <div className="p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Insights — Lifetime Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">All-time overview of your income, expenses and opportunities to save.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/export')}>Export</Button>
          <Button variant="primary" onClick={() => navigate('/ai-advisor', { state: { prefillFrom: 'insights' } })}>Ask AI for Recommendations</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <KPI label="Total Income" value={formatCurrency(lifetime.totalIncome)} sub="All time" />
            <KPI label="Total Expense" value={formatCurrency(lifetime.totalExpense)} sub="All time" />
            <KPI label="Total Savings" value={formatCurrency(lifetime.totalSavings)} sub={lifetime.totalSavings >= 0 ? 'Positive' : 'Negative'} />
            <KPI label="Avg / Month" value={`${formatCurrency(lifetime.avgMonthlyIncome)} / ${formatCurrency(lifetime.avgMonthlyExpense)}`} sub="Income / Expense" />
          </div>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-3">Long-Term Trend Analysis</h3>
            <div style={{ height: 320 }}>
              <Line data={lineData} options={chartOptions} />
            </div>
            <div className="text-sm text-slate-600 mt-3">
              Peaks: {monthly.length ? months.filter((m, i) => monthly[i].expense === Math.max(...monthly.map(x => x.expense))).join(', ') : 'N/A'}; Best savings month: {lifetime.bestSavingMonth || 'N/A'}; Worst spending month: {lifetime.worstSpendingMonth || 'N/A'}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-md font-semibold mb-2">High-Impact Insights</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Spending growth</div>
                <div>{pctBadge(insights.spendingGrowthPct)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Savings ratio</div>
                <div className="text-sm font-semibold">{insights.savingsRatio !== null ? insights.savingsRatio.toFixed(1) + '%' : 'N/A'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">Top category</div>
                <div className="text-sm font-semibold">{insights.biggestCategory ? categoryName(insights.biggestCategory) : 'N/A'}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">YOY change</div>
                <div>{pctBadge(insights.yoyChangePct)}</div>
              </div>

              <div className="border-t pt-3 flex gap-2">
                <Button variant="primary" size="md" onClick={() => navigate('/ai-advisor', { state: { prefillFrom: 'insights' } })}>Get AI Advice</Button>
                <Button variant="secondary" size="md" onClick={() => navigate('/export')}>Export Data</Button>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <div className="flex items-start gap-3">
              <div className="text-3xl">💡</div>
              <div className="flex-1">
                <h3 className="text-md font-bold text-amber-900 mb-1">Pro Tip</h3>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Use AI recommendations to identify spending patterns and create a personalized savings strategy. Ask our AI advisor for insights tailored to your financial goals.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card className="p-4 w-40%">
          <h3 className="text-lg font-semibold mb-3">All-Time Category Breakdown</h3>
          <div style={{ height: 240 }}>
            <Pie data={donut} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { position: 'right' } } }} />
          </div>
          <div className="mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs  text-slate-500">
                  <th>Category</th>
                  <th>Total</th>
                  <th>% of Expenses</th>
                  <th>Avg / month</th>
                </tr>
              </thead>
              <tbody>
                {cat.categories.slice(0, 10).map((c) => (
                    <tr key={c.category} className="border-t">
                      <td className="py-2 px-3">{categoryName(c.category)}</td>
                    <td className="py-2 px-3">{formatCurrency(c.total)}</td>
                    <td className="py-2 px-3">{c.percent.toFixed(1)}%</td>
                    <td className="py-2 px-3">{formatCurrency(c.avgMonthly)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cat.categories[0] && (
              <div className="text-xs text-slate-600 mt-3">Insight: <strong>{categoryName(cat.categories[0].category)}</strong> accounts for {cat.categories[0].percent.toFixed(1)}% of your total spending.</div>
            )}
          </div>
        </Card>
        <Card className=" p-4 w-60%">
          <h3 className="text-lg font-semibold mb-3">Category Trend Section</h3>
          <div className="space-y-3">
            {catTrends.map((ct) => (
              <div key={ct.category} className="flex items-center justify-between p-2 bg-white rounded border">
                <div>
                  <div className="text-sm font-semibold">{categoryName(ct.category)}</div>
                  <div className="text-xs text-slate-500">{ct.pctChange !== null ? `Change: ${ct.pctChange.toFixed(1)}%` : 'No change data'}</div>
                </div>
                <div style={{ width: 220, height: 50 }}>
                  <Line
                    data={{ labels: ct.months, datasets: [{ data: ct.values, borderColor: '#3B82F6', backgroundColor: 'transparent', tension: 0.3 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { display: false }, y: { display: false } } }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Top Spending Transactions (All time)</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500"><th>When</th><th>Category</th><th>Description</th><th>Amount</th></tr>
            </thead>
              <tbody>
              {topTx.map((t) => (
                <tr key={t._id || t.id} className="border-t">
                  <td className="py-2">{t.date ? new Date(t.date).toLocaleDateString() : '—'}</td>
                  <td className="py-2">{categoryName(t.category)}</td>
                  <td className="py-2">{t.description || '-'}</td>
                  <td className="py-2">{formatCurrency(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">Savings Trend</h3>
          <div style={{ height: 260 }}>
            <Line data={{ labels: months, datasets: [{ label: 'Savings', data: monthly.map(m => m.savings), borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,0.06)', tension: 0.3 }] }} options={chartOptions} />
          </div>
          <div className="text-sm text-slate-600 mt-3">Best month: {lifetime.bestSavingMonth || 'N/A'} — Worst month: {lifetime.worstSpendingMonth || 'N/A'}</div>
        </Card>
      </div>
    </div>
    </DashboardLayout>
  );
}
