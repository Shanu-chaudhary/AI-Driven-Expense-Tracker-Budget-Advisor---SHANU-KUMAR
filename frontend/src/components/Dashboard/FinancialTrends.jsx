import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
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
        backgroundColor: '#16a34a',
      },
      {
        label: 'Expense',
        data: [monthExpense, prevExpense],
        backgroundColor: '#dc2626',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(catMap),
    datasets: [
      {
        data: Object.values(catMap),
        backgroundColor: Object.keys(catMap).map((_, i) => {
          // pick visually distinct colors
          const palette = ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#7c3aed', '#ec4899'];
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
        backgroundColor: ['#16a34a', '#dc2626'],
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 700, easing: 'easeOutCubic' },
    plugins: {
      legend: { position: 'bottom' },
      tooltip: { mode: 'index', intersect: false },
    },
  };

  return (
    <div className="mt-8 bg-white rounded shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Financial Trends & Visualization</h3>
      {loading ? (
        <p className="text-sm text-gray-500">Loading charts...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="col-span-1 md:col-span-2 p-2">
            <div className="h-56 md:h-72">
              <Bar data={comparisonData} options={{...commonOptions, plugins: { ...commonOptions.plugins, legend: { position: 'top' } }}} />
            </div>
            <div className="text-sm text-gray-500 mt-2">Monthly income vs expense comparison (current vs previous month).</div>
          </div>

          <div className="col-span-1 p-2">
            <div className="h-56 md:h-72">
              <Pie data={pieData} options={commonOptions} />
            </div>
            <div className="text-sm text-gray-500 mt-2">Category-wise spending breakdown for the selected month.</div>
          </div>

          <div className="col-span-1 md:col-span-3 p-2">
            <div className="h-48 md:h-56">
              <Line
                data={{
                  labels: ['Income', 'Expense'],
                  datasets: [
                    {
                      label: 'This Month',
                      data: [monthIncome, monthExpense],
                      borderColor: monthIncome - monthExpense >= 0 ? '#06b6d4' : '#f97316',
                      backgroundColor: 'rgba(6,182,212,0.08)',
                      fill: true,
                      tension: 0.3,
                      pointRadius: 4,
                    },
                  ],
                }}
                options={{ ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false } } }}
              />
            </div>
            <div className="text-sm text-gray-500 mt-2">Smooth income/expense trend (line) for quick glance.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialTrends;
