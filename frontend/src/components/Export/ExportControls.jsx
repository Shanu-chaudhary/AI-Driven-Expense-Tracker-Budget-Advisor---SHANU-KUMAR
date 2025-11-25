import React, { useState, useEffect, useContext } from 'react';
import axios from '../../api/axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Chart from 'chart.js/auto';
import { ToastContext } from '../../context/ToastContext';

const ExportControls = ({ month }) => {
  const [exporting, setExporting] = useState(false);

  const fetchTxns = async () => {
    const res = await axios.get('/transactions/list');
    return res.data || [];
  };

  const [categories, setCategories] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const { addToast } = useContext(ToastContext);

  useEffect(()=>{
    const loadCats = async ()=>{
      try{ const r = await axios.get('/categories/list'); setCategories(r.data || []); }catch(e){ }
    };
    loadCats();
  },[]);

  // build quick lookup maps for categories (id -> obj, name -> obj)
  const categoriesById = Object.fromEntries((categories || []).map(c => [(c._id || c.id), c]));
  const categoriesByName = Object.fromEntries((categories || []).map(c => [c.name, c]));

  const getCategoryName = (cat) => {
    if (!cat) return 'Uncategorized';
    if (typeof cat === 'string') {
      // could be id or name
      const byId = categoriesById[cat];
      if (byId) return byId.name;
      const byName = categoriesByName[cat];
      if (byName) return byName.name;
      return cat; // fallback (raw id or name)
    }
    if (typeof cat === 'object') {
      if (cat.name) return cat.name;
      const id = cat._id || cat.id;
      if (id && categoriesById[id]) return categoriesById[id].name;
      return String(id || 'Uncategorized');
    }
    return String(cat);
  };

  const getCategoryIdForBudgetLookup = (cat) => {
    if (!cat) return '';
    if (typeof cat === 'string') {
      // if it's already an id, return as-is; if it's a name, try to find id
      if (categoriesById[cat]) return cat;
      if (categoriesByName[cat]) return categoriesByName[cat]._id || categoriesByName[cat].id || '';
      return cat;
    }
    if (typeof cat === 'object') {
      return cat._id || cat.id || (categoriesByName[cat.name] ? (categoriesByName[cat.name]._id || categoriesByName[cat.name].id) : '');
    }
    return '';
  };

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString();
    } catch (e) { return String(d); }
  };

  const applyFilters = (txns) => {
    return txns.filter(t => {
      const d = t.date ? new Date(t.date) : null;
      if (startDate && d && d < new Date(startDate)) return false;
      if (endDate && d && d > new Date(endDate)) return false;
      if (categoryFilter) {
        const catName = getCategoryName(t.category);
        if (String(catName) !== String(categoryFilter)) return false;
      }
      return true;
    });
  };

  const downloadCSV = async () => {
    setExporting(true);
    try {
      const txnsRaw = await fetchTxns();
      const txns = applyFilters(txnsRaw);
      const header = ['Date', 'Category', 'Type', 'Amount', 'Note'];
      const rows = txns.map(t => [formatDate(t.date || t.createdAt), getCategoryName(t.category), t.type, t.amount, t.note || '']);
      const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `transactions_export_${(month||'all')}.csv`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export CSV failed', err);
      addToast('Failed to export CSV', 'error');
    } finally {
      setExporting(false);
    }
  };

  const downloadPDF = async () => {
    setExporting(true);
    try {
      const txnsRaw = await fetchTxns();
      const txns = applyFilters(txnsRaw);

      // read budgets for the selected month from localStorage
      const budgetsRaw = (() => {
        try { return JSON.parse(localStorage.getItem('budgets_v1') || '{}'); } catch(e){ return {}; }
      })();
      const monthKey = month || `${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}`;

      // compute spent per category for the selected month
      const spentByCat = {};
      txns.forEach(t => {
        const d = t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : null);
        if (!d) return;
        const [y, m] = monthKey.split('-').map(Number);
        if (d.getFullYear() !== y || (d.getMonth()+1) !== m) return;
        const catName = getCategoryName(t.category);
        spentByCat[catName] = (spentByCat[catName] || 0) + Number(t.amount || 0);
      });

      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const left = 40;
      let cursorY = 40;

      // Header - project name and note
      doc.setFillColor(249, 115, 22); // orange (tailwind orange-500-ish)
      doc.rect(0, 0, pageWidth, 60, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(18);
      doc.text('BudgetPilot', left, 38);
      doc.setFontSize(10);
      doc.text('Exported financial transactions and summary', left, 54);
      cursorY = 80;
      doc.setTextColor(0,0,0);

      // Small summary line
      const totalIncome = txns.filter(t=> (t.type||'').toLowerCase() === 'income').reduce((s,a)=>s+Number(a.amount||0),0);
      const totalExpense = txns.filter(t=> (t.type||'').toLowerCase() !== 'income').reduce((s,a)=>s+Number(a.amount||0),0);
      doc.setFontSize(11);
      doc.text(`Month: ${monthKey}    Total Income: ${totalIncome.toLocaleString()}    Total Expense: ${totalExpense.toLocaleString()}`, left, cursorY);
      cursorY += 18;

      // Build table rows with Category Budget and Remaining
      const tableBody = txns.map(t => {
        const dateStr = formatDate(t.date || t.createdAt);
        const catName = getCategoryName(t.category);
        const type = t.type || '';
        const amount = Number(t.amount || 0);
        const note = t.note || t.description || t.descriptionText || '';
        const catId = getCategoryIdForBudgetLookup(t.category) || catName;
        const catBudget = (budgetsRaw && budgetsRaw[monthKey] && budgetsRaw[monthKey][catId]) ? Number(budgetsRaw[monthKey][catId]) : (budgetsRaw && budgetsRaw[monthKey] && budgetsRaw[monthKey][catName] ? Number(budgetsRaw[monthKey][catName]) : 0);
        const spent = spentByCat[catName] || 0;
        const remaining = catBudget - spent;
        return [dateStr, catName, type, amount.toFixed(2), String(note).slice(0,200), catBudget ? catBudget.toFixed(2) : '-', (typeof remaining === 'number' ? remaining.toFixed(2) : '-')];
      });

      // add a small bar chart image for category-wise expenses
      // create offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = 700; canvas.height = 200;
      const labels = Object.keys(spentByCat);
      const dataVals = labels.map(l => spentByCat[l]);
      // eslint-disable-next-line no-unused-vars
      const chart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
          labels,
          datasets: [{ label: 'Expense by Category', data: dataVals, backgroundColor: labels.map((_,i)=>['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#06b6d4','#3b82f6'][i%8]) }]
        },
        options: { responsive: false, animation: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { autoSkip: false } } } }
      });
      // force chart to draw (Chart.js will draw immediately in browser)
      const chartDataUrl = canvas.toDataURL('image/png');
      // insert image into PDF
      doc.addImage(chartDataUrl, 'PNG', left, cursorY, pageWidth - left*2, 90);
      cursorY += 100;

      // add table using autotable
      autoTable(doc, {
        startY: cursorY,
        head: [['Date', 'Category', 'Type', 'Amount', 'Description', 'Cat Budget', 'Remaining']],
        body: tableBody,
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [249,115,22], textColor: 255 },
        alternateRowStyles: { fillColor: [245,245,245] },
        columnStyles: {
          3: { halign: 'right' },
          5: { halign: 'right' },
          6: { halign: 'right' }
        },
        margin: { left, right: left }
      });

      doc.save(`budgetpilot_transactions_${monthKey}.pdf`);
    } catch (err) {
      console.error('Export PDF failed', err);
      addToast('Failed to export PDF', 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-4">
      <h4 className="font-semibold mb-2">Export Financial Data</h4>
      <div className="flex gap-2 items-center mb-3">
        <label className="text-sm">From:</label>
        <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="border rounded p-1" />
        <label className="text-sm">To:</label>
        <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="border rounded p-1" />
        <select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)} className="border rounded p-1">
          <option value="">All categories</option>
          {categories.map(c => <option key={c._id || c.id} value={c.name}>{c.name}</option>)}
        </select>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={downloadCSV} disabled={exporting} className="bg-orange_peel-500 hover:bg-orange_peel-400 text-white py-2 px-3 rounded">
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
        <button onClick={downloadPDF} disabled={exporting} className="bg-sky-600 hover:bg-sky-500 text-white py-2 px-3 rounded">
          {exporting ? 'Exporting...' : 'Export PDF'}
        </button>
      </div>
      <p className="text-sm text-gray-500 mt-2">CSV includes basic fields; PDF is a simple formatted export suitable for printing.</p>
    </div>
  );
};

export default ExportControls;
