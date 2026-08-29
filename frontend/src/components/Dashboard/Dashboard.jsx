import React, { useContext, useEffect, useState, useRef } from "react";
import DashboardLayout from "../Layout/DashboardLayout";
import ProfileCard from "./ProfileCard";
import FinancialTrends from "./FinancialTrends";
import TipCard from "../Tips/TipCard";
import Card from "../ui/Card";
import Button from "../ui/Button";
import { AuthContext } from "../../context/AuthContext";
import TransactionForm from "../Transactions/TransactionForm";
import TransactionList from "../Transactions/TransactionList";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";


const Dashboard = () => {
  // const { profile } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [summaryMonth, setSummaryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  });
  const [tips, setTips] = useState([]);
  const [tipsLoading, setTipsLoading] = useState(false);
  // const [refreshKey, setRefreshKey] = useState(0);
  const listRef = useRef();
  const navigate = useNavigate();


  // fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get("/profile/me");
        setProfile(res.data);
      } catch (err) {
        console.error("Failed to fetch profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Fetch rule-based tips
  useEffect(() => {
    const fetchTips = async () => {
      setTipsLoading(true);
      try {
        const res = await axios.get("/tips/recommend");
        if (res.data && Array.isArray(res.data)) {
          setTips(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch tips", err);
      } finally {
        setTipsLoading(false);
      }
    };

    fetchTips();
  }, []);

  // AI history removed: we no longer fetch or surface stored AI advice

  // fetch summary whenever selected month changes
  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const res = await axios.get('/transactions/list');
        const txns = res.data || [];
        const [y, m] = summaryMonth.split('-').map((v) => Number(v));
        let income = 0;
        let expense = 0;
        txns.forEach((t) => {
          const date = t.date ? new Date(t.date) : null;
          if (!date) return;
          if (date.getFullYear() === y && date.getMonth() + 1 === m) {
            const amt = Number(t.amount) || 0;
            const type = (t.type || '').toString().toLowerCase();
            if (type === 'income') income += amt;
            else expense += amt;
          }
        });
        setIncomeTotal(income);
        setExpenseTotal(expense);
      } catch (err) {
        console.error('Failed to fetch summary', err);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchSummary();
  }, [summaryMonth]);

  if (loading) {
    return <p className="text-center text-slate-600">Loading dashboard...</p>;
  }


  const handleTransactionAdded = (newTxn) => {
    // Instantly add to TransactionList UI
    if (listRef.current) {
      listRef.current.addTransactionToList(newTxn);
    }
  };

  return (
    <DashboardLayout>
      <div className="text-center">

        {/* <ProfileCard profile={profile} /> */}

        {/* Summary placed below profile card */}
        <div className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 bg-gradient-to-br from-white to-green-50 border-2 border-green-200">
              <div className="text-xs font-semibold text-slate-600 mb-2">💸 Income</div>
              <div className="text-3xl font-black bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
                {summaryLoading ? '...' : `+₹${incomeTotal.toLocaleString()}`}
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-white to-red-50 border-2 border-red-200">
              <div className="text-xs font-semibold text-slate-600 mb-2">🧾 Expense</div>
              <div className="text-3xl font-black bg-gradient-to-r from-red-500 to-rose-600 bg-clip-text text-transparent">
                {summaryLoading ? '...' : `-₹${expenseTotal.toLocaleString()}`}
              </div>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200">
              <div className="text-xs font-semibold text-slate-600 mb-2">{summaryLoading ? 'Savings' : ( (incomeTotal - expenseTotal) >= 0 ? '🎉 Savings' : '⚠️ Savings' )}</div>
              <div className={`text-3xl font-black ${
                (incomeTotal - expenseTotal) >= 0
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent'
              }`}>
                {summaryLoading ? '...' : `₹${(incomeTotal - expenseTotal).toLocaleString()}`}
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-3">
              <input type="month" value={summaryMonth} onChange={(e)=>setSummaryMonth(e.target.value)} className="border rounded p-2 text-sm bg-transparent" />
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="md" onClick={() => navigate('/transactions')}>Add New Transaction →</Button>
            </div>
          </div>
        </div>

        {/* Financial visualization module */}
        <div className="mt-4 px-0">
          <FinancialTrends month={summaryMonth} />
        </div>

        {/* AI history preview removed (we no longer store AI advice) */}

        {/* Rule-Based Tips Section */}
        {tips.length > 0 && (
          <div className="mt-8 px-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold bp-gradient-text">💡 Financial Tips</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/ai-advisor')}>View More →</Button>
            </div>
            <TipCard tips={tips.slice(0, 3)} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
