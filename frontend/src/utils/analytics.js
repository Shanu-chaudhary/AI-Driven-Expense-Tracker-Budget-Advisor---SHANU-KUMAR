// Helper: normalize date to YYYY-MM
function monthKey(date) {
  const d = new Date(date);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function aggregateLifetimeTotals(transactions = []) {
  let totalIncome = 0;
  let totalExpense = 0;
  const months = new Set();

  transactions.forEach((t) => {
    const amt = Number(t.amount) || 0;
    const type = (t.type || '').toLowerCase();
    const key = t.date ? monthKey(t.date) : null;
    if (key) months.add(key);
    if (type === 'income') totalIncome += amt;
    else totalExpense += amt;
  });

  const totalMonths = Math.max(1, months.size);
  const avgMonthlyIncome = totalIncome / totalMonths;
  const avgMonthlyExpense = totalExpense / totalMonths;
  const totalSavings = totalIncome - totalExpense;

  // compute monthly savings to find best/worst months
  const monthly = {};
  transactions.forEach((t) => {
    const k = t.date ? monthKey(t.date) : null;
    if (!k) return;
    if (!monthly[k]) monthly[k] = { income: 0, expense: 0 };
    const amt = Number(t.amount) || 0;
    const type = (t.type || '').toLowerCase();
    if (type === 'income') monthly[k].income += amt;
    else monthly[k].expense += amt;
  });

  let bestSavingMonth = null;
  let worstSpendingMonth = null;
  Object.keys(monthly).forEach((k) => {
    const s = monthly[k].income - monthly[k].expense;
    if (bestSavingMonth === null || s > monthly[bestSavingMonth].income - monthly[bestSavingMonth].expense) {
      bestSavingMonth = k;
    }
    if (worstSpendingMonth === null || monthly[k].expense > monthly[worstSpendingMonth].expense) {
      worstSpendingMonth = k;
    }
  });

  return {
    totalIncome,
    totalExpense,
    totalSavings,
    avgMonthlyIncome,
    avgMonthlyExpense,
    bestSavingMonth,
    worstSpendingMonth,
    monthly,
  };
}

export function aggregateCategoryBreakdown(transactions = []) {
  const catMap = {};
  let totalExpense = 0;
  transactions.forEach((t) => {
    const type = (t.type || '').toLowerCase();
    const amt = Number(t.amount) || 0;
    if (type === 'income') return;
    totalExpense += amt;
    const name = (t.category && (t.category.name || t.category)) || 'Uncategorized';
    catMap[name] = (catMap[name] || 0) + amt;
  });

  const categories = Object.keys(catMap).map((k) => ({
    category: k,
    total: catMap[k],
    percent: totalExpense > 0 ? (catMap[k] / totalExpense) * 100 : 0,
    avgMonthly: 0,
  }));

  // compute avg monthly per category
  const months = new Set();
  transactions.forEach((t) => {
    if (!t.date) return;
    months.add(monthKey(t.date));
  });
  const monthCount = Math.max(1, months.size);
  categories.forEach((c) => (c.avgMonthly = c.total / monthCount));

  categories.sort((a, b) => b.total - a.total);
  return { categories, totalExpense };
}

export function aggregateMonthlyTrends(transactions = []) {
  const map = {}; // key -> {income, expense}
  transactions.forEach((t) => {
    const k = t.date ? monthKey(t.date) : null;
    if (!k) return;
    if (!map[k]) map[k] = { income: 0, expense: 0 };
    const amt = Number(t.amount) || 0;
    const type = (t.type || '').toLowerCase();
    if (type === 'income') map[k].income += amt;
    else map[k].expense += amt;
  });

  const keys = Object.keys(map).sort();
  const series = keys.map((k) => ({
    month: k,
    income: map[k].income,
    expense: map[k].expense,
    savings: map[k].income - map[k].expense,
  }));

  return series;
}

export function computeCategoryTrends(transactions = [], majorN = 8) {
  // produce month-series per category
  const catMonth = {}; // cat -> month -> total
  const monthsSet = new Set();
  transactions.forEach((t) => {
    const k = t.date ? monthKey(t.date) : null;
    if (!k) return;
    monthsSet.add(k);
    const type = (t.type || '').toLowerCase();
    if (type === 'income') return;
    const name = (t.category && (t.category.name || t.category)) || 'Uncategorized';
    if (!catMonth[name]) catMonth[name] = {};
    catMonth[name][k] = (catMonth[name][k] || 0) + (Number(t.amount) || 0);
  });

  const months = Array.from(monthsSet).sort();
  // compute totals to pick major categories
  const totals = Object.keys(catMonth).map((c) => ({
    category: c,
    total: Object.values(catMonth[c]).reduce((a, b) => a + b, 0),
  }));
  totals.sort((a, b) => b.total - a.total);
  const majors = totals.slice(0, majorN).map((t) => t.category);

  const result = majors.map((cat) => {
    const values = months.map((m) => catMonth[cat][m] || 0);
    // compute percent change over last 6 months if available
    const last6 = values.slice(Math.max(0, values.length - 6));
    const pctChange = (last6.length >= 2 && last6[0] > 0) ? ((last6[last6.length - 1] - last6[0]) / last6[0]) * 100 : null;
    return { category: cat, months, values, pctChange };
  });

  return result;
}

export function computeInsights(transactions = []) {
  const lifetime = aggregateLifetimeTotals(transactions);
  const category = aggregateCategoryBreakdown(transactions);
  const monthly = aggregateMonthlyTrends(transactions);

  // spending growth percent (compare last 6 months vs previous 6)
  const months = monthly.map((m) => m.month);
  const last12 = monthly.slice(-12);
  const last6 = last12.slice(-6);
  const prev6 = last12.slice(0, Math.max(0, last12.length - 6));

  const sum = (arr, key) => arr.reduce((s, x) => s + (x[key] || 0), 0);
  const last6Spend = sum(last6, 'expense');
  const prev6Spend = sum(prev6, 'expense') || 1;
  const spendingGrowthPct = ((last6Spend - prev6Spend) / prev6Spend) * 100;

  const savingsRatio = lifetime.totalIncome > 0 ? (lifetime.totalSavings / lifetime.totalIncome) * 100 : null;

  const biggestCategory = (category.categories && category.categories[0]) || null;

  // YOY change: compute year-over-year by comparing same month last year totals (approx)
  // naive: compare sum last 12 months vs previous 12
  const last12Spend = sum(last12, 'expense');
  // prev 12
  const prev12 = monthly.slice(Math.max(0, monthly.length - 24), Math.max(0, monthly.length - 12));
  const prev12Spend = sum(prev12, 'expense') || 1;
  const yoyChangePct = ((last12Spend - prev12Spend) / prev12Spend) * 100;

  return {
    spendingGrowthPct: Number.isFinite(spendingGrowthPct) ? spendingGrowthPct : 0,
    savingsRatio: Number.isFinite(savingsRatio) ? savingsRatio : null,
    biggestCategory: biggestCategory ? biggestCategory.category : null,
    biggestCategoryAmount: biggestCategory ? biggestCategory.total : null,
    yoyChangePct: Number.isFinite(yoyChangePct) ? yoyChangePct : 0,
  };
}

export function topSpendingTransactions(transactions = [], limit = 10) {
  return transactions
    .filter((t) => ((t.type || '').toLowerCase() !== 'income'))
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, limit);
}
