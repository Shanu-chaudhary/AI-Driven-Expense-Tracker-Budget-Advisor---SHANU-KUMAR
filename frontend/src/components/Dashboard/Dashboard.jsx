import React, { useContext, useEffect, useState, useRef } from "react";
import DashboardLayout from "../Layout/DashboardLayout";
import ProfileCard from "./ProfileCard";
import FinancialTrends from "./FinancialTrends";
import TipCard from "../Tips/TipCard";
import AiHistoryCard from "../AI/AiHistoryCard";
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
  const [latestAiAdvice, setLatestAiAdvice] = useState(null);
  const [tipsLoading, setTipsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
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

  // Fetch latest AI advice
  useEffect(() => {
    const fetchLatestAdvice = async () => {
      setAiLoading(true);
      try {
        const res = await axios.get("/ai/history");
        if (res.data?.history && res.data.history.length > 0) {
          setLatestAiAdvice(res.data.history[0]); // Most recent first
        }
      } catch (err) {
        console.error("Failed to fetch AI advice", err);
      } finally {
        setAiLoading(false);
      }
    };

    fetchLatestAdvice();
  }, []);

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
    return <p className="text-center text-gray-500">Loading dashboard...</p>;
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

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">💸 Income</div>
              <div className="text-2xl font-semibold text-green-600">
                {summaryLoading ? '...' : `+${incomeTotal.toLocaleString()}`}
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">🧾 Expense</div>
              <div className="text-2xl font-semibold text-red-600">
                {summaryLoading ? '...' : `-${expenseTotal.toLocaleString()}`}
              </div>
            </div>
            <div className="bg-white p-4 rounded shadow">
              <div className="text-sm text-gray-500">{summaryLoading ? 'Savings' : ( (incomeTotal - expenseTotal) >= 0 ? '🎉 Savings' : '⚠️ Savings' )}</div>
              <div className="text-2xl font-semibold text-blue-600">
                {summaryLoading ? '...' : `${(incomeTotal - expenseTotal).toLocaleString()}`}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-start gap-3 mb-2">
            {/* <label className="text-sm">Select month:</label> */}
            <input type="month" value={summaryMonth} onChange={(e)=>setSummaryMonth(e.target.value)} className="border rounded p-0 text-xs font-semibold" />
            <button
          onClick={() => navigate("/transactions")}
          className="text-orange_peel-500 hover:text-orange_peel-600 font-semibold underline inline-block"
        >
           Add New Transaction →
        </button>
          </div>
        </div>

        {/* Financial visualization module */}
        <div className="mt-4 px-2">
          <FinancialTrends month={summaryMonth} />
        </div>

        {/* AI Insights Preview Section */}
        {latestAiAdvice && (
          <div className="mt-8 px-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">🤖 Latest AI Insights</h3>
              <button
                onClick={() => navigate("/ai-advisor")}
                className="text-orange_peel-500 hover:text-orange_peel-600 font-semibold underline text-sm"
              >
                View All →
              </button>
            </div>
            <div className="max-w-lg">
              <AiHistoryCard entry={latestAiAdvice} />
            </div>
          </div>
        )}

        {/* Rule-Based Tips Section */}
        {tips.length > 0 && (
          <div className="mt-8 px-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">💡 Financial Tips</h3>
              <button
                onClick={() => navigate("/ai-advisor")}
                className="text-orange_peel-500 hover:text-orange_peel-600 font-semibold underline text-sm"
              >
                View More →
              </button>
            </div>
            <TipCard tips={tips.slice(0, 3)} />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
