import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import Card from '../ui/Card.jsx';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

const FinancialTrends = ({ month }) => {
  const [loading, setLoading] = useState(true);
  const [txnData, setTxnData] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [txRes, catRes] = await Promise.all([
          axios.get('/transactions/list'),
          axios.get('/categories/list'),
        ]);
        setTxnData(txRes.data || []);
        setCategories(catRes.data || []);
      } catch (err) {
        console.error('Failed to load financial trends data', err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  // Helpers to compute datasets
  const toNumber = (v) => (v == null ? 0 : Number(v));

  // month param expected 'YYYY-MM'
  const parseMonth = (m) => {
    if (!m) return null;
    const [y, mm] = m.split('-').map((s) => Number(s));
    return { year: y, month: mm };
  };

  const selected = parseMonth(month);

  // compute monthly totals and category-wise spending
  let monthIncome = 0;
  let monthExpense = 0;
  const catMap = {}; // name->amount for expense categories

  // prepare a map of category id -> name
  const catById = {};
  categories.forEach((c) => {
    catById[c._id || c.id || c.idStr || c.id] = c.name || c;
  });

  txnData.forEach((t) => {
    const date = t.date ? new Date(t.date) : null;
    if (!date) return;
    if (selected && (date.getFullYear() !== selected.year || date.getMonth() + 1 !== selected.month)) return;
    const amt = toNumber(t.amount);
    const type = (t.type || '').toString().toLowerCase();
    if (type === 'income') monthIncome += amt;
    else monthExpense += amt;

    // category-wise only for expenses
    const catId = t.category && (t.category._id || t.category.id || t.category) || 'Uncategorized';
    const catName = catById[catId] || (t.category && t.category.name) || String(catId) || 'Uncategorized';
    catMap[catName] = (catMap[catName] || 0) + amt;
  });

  // Monthly spending comparison: current month vs previous month
  const prevMonth = (() => {
    if (!selected) return null;
    const y = selected.year;
    const m = selected.month;
    const d = new Date(y, m - 1, 1); // JS months 0-indexed, so this is next month
    d.setMonth(d.getMonth() - 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  })();

  let prevIncome = 0;
  let prevExpense = 0;
  if (prevMonth) {
    txnData.forEach((t) => {
      const date = t.date ? new Date(t.date) : null;
      if (!date) return;
      if (date.getFullYear() === prevMonth.year && date.getMonth() + 1 === prevMonth.month) {
        const amt = toNumber(t.amount);
        const type = (t.type || '').toString().toLowerCase();
        if (type === 'income') prevIncome += amt;
        else prevExpense += amt;
      }
    });
  }

  // Prepare chart data
  const comparisonData = {
    labels: [
      month ? `${month}` : 'Selected',
      prevMonth ? `${prevMonth.year}-${String(prevMonth.month).padStart(2, '0')}` : 'Previous',
    ],
    datasets: [
      {
        label: 'Income',
        data: [monthIncome, prevIncome],
        backgroundColor: '#3B82F6',
      },
      {
        label: 'Expense',
        data: [monthExpense, prevExpense],
        backgroundColor: '#06B6D4',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(catMap),
    datasets: [
      {
        data: Object.values(catMap),
        backgroundColor: Object.keys(catMap).map((_, i) => {
          // pick visually distinct colors with modern blue/cyan palette
          const palette = ['#3B82F6', '#06B6D4', '#8B5CF6', '#EC4899', '#F59E0B', '#EF4444', '#10B981', '#0288d1', '#00BCD4', '#00ACC1'];
          return palette[i % palette.length];
        }),
        hoverOffset: 8,
      },
    ],
  };

  const barData = {
    labels: ['Income', 'Expense'],
    datasets: [
      {
        label: 'Amount',
        data: [monthIncome, monthExpense],
        backgroundColor: ['#3B82F6', '#06B6D4'],
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutCubic' },
    plugins: {
      legend: { position: 'bottom', labels: { color: '#1E293B', font: { size: 13, weight: 'bold' }, padding: 15 } },
      tooltip: { mode: 'index', intersect: false, backgroundColor: 'rgba(0,0,0,0.8)', titleColor: '#fff', bodyColor: '#fff', borderColor: '#3B82F6', borderWidth: 2, padding: 10, displayColors: true },
    },
    scales: {
      x: { ticks: { color: '#475569', font: { size: 11, weight: 'bold' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { ticks: { color: '#475569', font: { size: 11, weight: 'bold' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
    },
  };

  return (
    <Card className="mt-8 p-6">
      <h3 className="text-2xl font-bold mb-6 bp-gradient-text">Financial Trends & Visualization</h3>
      {loading ? (
        <p className="text-sm text-slate-600">Loading charts...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Comparison Chart */}
          <Card className="col-span-1 md:col-span-2 p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Monthly Comparison</h4>
            <div className="h-56 md:h-72 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-2">
              <Bar data={comparisonData} options={{...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'top', labels: { color: '#1E293B' } } }}} />
            </div>
            <div className="text-xs text-slate-600 mt-3 text-center">Current vs Previous Month Income/Expense</div>
          </Card>

          {/* Pie Chart */}
          <Card className="col-span-1 p-4 border border-cyan-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Spending Breakdown</h4>
            <div className="h-56 md:h-72 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg p-2">
              <Pie data={pieData} options={commonOptions} />
            </div>
            <div className="text-xs text-slate-600 mt-3 text-center">Category-wise Distribution</div>
          </Card>

          {/* Line Chart */}
          <Card className="col-span-1 md:col-span-3 p-4 border border-blue-200">
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Monthly Trend</h4>
            <div className="h-48 md:h-56 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg p-2">
              <Line
                data={{
                  labels: ['Income', 'Expense'],
                  datasets: [
                    {
                      label: 'This Month',
                      data: [monthIncome, monthExpense],
                      borderColor: '#3B82F6',
                      backgroundColor: 'rgba(59,130,246,0.1)',
                      fill: true,
                      tension: 0.4,
                      pointRadius: 6,
                      pointBackgroundColor: '#06B6D4',
                      pointBorderColor: '#fff',
                      pointBorderWidth: 2.5,
                      borderWidth: 3,
                    },
                  ],
                }}
                options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: true, labels: { color: '#1E293B' } } } }}
              />
            </div>
            <div className="text-xs text-slate-600 mt-3 text-center">Income vs Expense Trend</div>
          </Card>
        </div>
      )}
    </Card>
  );
};

export default FinancialTrends;
