
// import React, { useEffect, useState, useRef } from "react";
// import axios from "../api/axios";
// import DashboardLayout from "../components/Layout/DashboardLayout";
// import { format } from "date-fns";
// import TransactionForm from "../components/Transactions/TransactionForm";

// export default function TransactionsPage() {
//   const [transactions, setTransactions] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [selectedTxn, setSelectedTxn] = useState(null);
//   const [isEditing, setIsEditing] = useState(false);
//   const [filterType, setFilterType] = useState("all");
//   const [popupMessage, setPopupMessage] = useState("");
//   const [showPopup, setShowPopup] = useState(false);
//   const listRef = useRef();

//   // Fetch transactions
//   const fetchTransactions = async () => {
//     try {
//       const token = localStorage.getItem("token");
//       const res = await axios.get("/transactions/list", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       const normalized = res.data.map(t => ({ ...t, _id: t._id || t.id }));
//       setFiltered(normalized);
//       setTransactions(normalized);
//     } catch (err) {
//       console.error("Failed to fetch transactions", err);
//     }
//   };

//   useEffect(() => {
//     fetchTransactions();
//   }, []);

//   // Apply filter
//   const applyFilter = (type) => {
//     setFilterType(type);
//     if (type === "income") {
//       setFiltered(transactions.filter((t) => t.type === "income"));
//     } else if (type === "expense") {
//       setFiltered(transactions.filter((t) => t.type === "expense"));
//     } else {
//       setFiltered(transactions);
//     }
//   };

//   // ✅ Delete transaction and update UI instantly
//   const handleDelete = async (id) => {
//   try {
//     if (!id) {
//       console.error("❌ Missing transaction ID");
//       return;
//     }

//     const token = localStorage.getItem("token");
//     await axios.delete(`/transactions/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     // Remove from UI instantly
//     setTransactions((prev) => prev.filter((t) => t._id !== id));
//     setFiltered((prev) => prev.filter((t) => t._id !== id));

//     setPopupMessage("Transaction deleted successfully!");
//     setShowPopup(true);
//     setTimeout(() => setShowPopup(false), 2500);
//   } catch (err) {
//     console.error("Delete failed", err);
//   }
// };




//   const handleSaveEdit = async () => {
//   try {
//     if (!selectedTxn?._id) throw new Error("Missing transaction ID");

//     const token = localStorage.getItem("token");
//     const { _id, ...payload } = selectedTxn;

//     const res = await axios.put(`/transactions/${_id}`, payload, {
//       headers: { Authorization: `Bearer ${token}` },
//     });

//     await fetchTransactions();


//     setIsEditing(false);
//     setSelectedTxn(null);

//     setPopupMessage("Transaction updated successfully!");
//     setShowPopup(true);
//     setTimeout(() => setShowPopup(false), 2500);
//   } catch (err) {
//     console.error("Update failed", err);
//   }
// };


//   const handleEdit = (txn) => {
//   if (!txn._id && txn.id) txn._id = txn.id;
//   setSelectedTxn(txn);
//   setIsEditing(true);
// };

// const handleTransactionAdded = (newTxn) => {
//     // Instantly add to TransactionList UI
//     if (listRef.current) {
//       listRef.current.addTransactionToList(newTxn);
//     }
//   };


//   return (
//     <DashboardLayout>
//         <h2 className="text-2xl font-bold mb-6 text-light_sea_green-600">
//           Add New Transaction
//         </h2>
//     <TransactionForm onTransactionAdded={handleTransactionAdded} />
//       <div className="p-6">
//         <h2 className="text-xl font-bold mb-6 text-light_sea_green-600">
//           History
//         </h2>

//         {/* ✅ Popup Notification */}
//         {showPopup && (
//           <div className="fixed top-5 right-5 bg-light_sea_green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
//             {popupMessage}
//           </div>
//         )}

//         {/* ✅ Filter Buttons */}
//         <div className="flex justify-center gap-3 mb-4">
//           <button
//             onClick={() => applyFilter("all")}
//             className={`px-4 py-2 rounded-lg border ${
//               filterType === "all"
//                 ? "bg-light_sea_green-500 text-white"
//                 : "border-light_sea_green-500 text-light_sea_green-500 hover:bg-light_sea_green-50"
//             }`}
//           >
//             All
//           </button>
//           <button
//             onClick={() => applyFilter("income")}
//             className={`px-4 py-2 rounded-lg border ${
//               filterType === "income"
//                 ? "bg-green-500 text-white"
//                 : "border-green-500 text-green-500 hover:bg-green-50"
//             }`}
//           >
//             Income
//           </button>
//           <button
//             onClick={() => applyFilter("expense")}
//             className={`px-4 py-2 rounded-lg border ${
//               filterType === "expense"
//                 ? "bg-red-500 text-white"
//                 : "border-red-500 text-red-500 hover:bg-red-50"
//             }`}
//           >
//             Expense
//           </button>
//         </div>

//         {/* Transaction List */}
//         <div className="bg-white shadow-md rounded-lg p-4 border border-orange_peel-200">
//           {filtered.length === 0 ? (
//             <p className="text-center text-gray-500">No transactions found.</p>
//           ) : (
//             <ul className="divide-y">
//               {filtered.map((txn, index) => (
//                 <li
//                   key={txn._id || txn.id || index}
//                   className="py-4 flex justify-between items-center"
//                 >
//                   <div>
//                     <p className="font-medium">{txn.category}</p>
//                     <p className="text-sm text-gray-500">
//                       {txn.description || "-"}
//                     </p>
//                     <p className="text-xs text-gray-400">
//                       {format(new Date(txn.date), "dd MMM yyyy")}
//                     </p>
//                   </div>
//                   <div className="text-right">
//                     <p
//                       className={`font-semibold ${
//                         txn.type === "income"
//                           ? "text-green-600"
//                           : "text-red-600"
//                       }`}
//                     >
//                       {txn.type === "income" ? "+" : "-"}
//                       {Number(txn.amount).toLocaleString()}
//                     </p>
//                     <div className="space-x-2 mt-1">
//                       <button
//                         onClick={() => {
//                           setSelectedTxn(txn);
//                           setIsEditing(false);
//                         }}
//                         className="text-light_sea_green-500 hover:underline"
//                       >
//                         View
//                       </button>
//                       <button
//                         onClick={() => handleEdit(txn)}
//                         className="text-orange_peel-500 hover:underline"
//                       >
//                         Edit
//                       </button>
//                       <button
//                         onClick={() => handleDelete(txn._id || txn.id)}
//                         className="text-red-500 hover:underline"
//                       >
//                         Delete
//                       </button>
//                     </div>
//                   </div>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </div>

//         {/* ✅ Modal */}
//         {selectedTxn && (
//           <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
//             <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
//               <h3 className="text-xl font-semibold mb-4">
//                 {isEditing ? "Edit Transaction" : "Transaction Details"}
//               </h3>

//               <div className="space-y-3">
//                 <div>
//                   <label className="block text-sm font-medium">Category</label>
//                   <input
//                     type="text"
//                     value={selectedTxn.category}
//                     onChange={(e) =>
//                       setSelectedTxn({
//                         ...selectedTxn,
//                         category: e.target.value,
//                       })
//                     }
//                     disabled={!isEditing}
//                     className="w-full border p-2 rounded"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Amount</label>
//                   <input
//                     type="number"
//                     value={selectedTxn.amount}
//                     onChange={(e) =>
//                       setSelectedTxn({
//                         ...selectedTxn,
//                         amount: e.target.value,
//                       })
//                     }
//                     disabled={!isEditing}
//                     className="w-full border p-2 rounded"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Description</label>
//                   <textarea
//                     value={selectedTxn.description || ""}
//                     onChange={(e) =>
//                       setSelectedTxn({
//                         ...selectedTxn,
//                         description: e.target.value,
//                       })
//                     }
//                     disabled={!isEditing}
//                     className="w-full border p-2 rounded"
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Type</label>
//                   <select
//                     value={selectedTxn.type}
//                     onChange={(e) =>
//                       setSelectedTxn({
//                         ...selectedTxn,
//                         type: e.target.value,
//                       })
//                     }
//                     disabled={!isEditing}
//                     className="w-full border p-2 rounded"
//                   >
//                     <option value="income">Income</option>
//                     <option value="expense">Expense</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium">Date</label>
//                   <input
//                     type="date"
//                     value={
//                       selectedTxn.date
//                         ? new Date(selectedTxn.date)
//                             .toISOString()
//                             .slice(0, 10)
//                         : ""
//                     }
//                     onChange={(e) =>
//                       setSelectedTxn({
//                         ...selectedTxn,
//                         date: e.target.value,
//                       })
//                     }
//                     disabled={!isEditing}
//                     className="w-full border p-2 rounded"
//                   />
//                 </div>

//                 <div className="flex justify-end space-x-3 mt-4">
//                   {isEditing && (
//                     <button
//                       onClick={handleSaveEdit}
//                       className="bg-light_sea_green-500 text-white px-4 py-2 rounded hover:bg-light_sea_green-400"
//                     >
//                       Save
//                     </button>
//                   )}
//                   <button
//                     onClick={() => setSelectedTxn(null)}
//                     className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </DashboardLayout>
//   );
// }


import React, { useEffect, useState, useRef } from "react";
import axios from "../api/axios";
import DashboardLayout from "../components/Layout/DashboardLayout";
import { format } from "date-fns";
import TransactionForm from "../components/Transactions/TransactionForm";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]); // { _id, name, type }
  const [categoryMap, setCategoryMap] = useState({}); // id -> name
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // 'all' | 'month' | 'range'
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const listRef = useRef();

  // Fetch categories & transactions
  const fetchCategories = async () => {
    try {
      const res = await axios.get("/categories/list");
      const normalized = (res.data || []).map((c) => ({
        ...c,
        _id: c._id || c.id,
      }));
      setCategories(normalized);
      const map = normalized.reduce((acc, c) => {
        acc[c._id] = c.name;
        return acc;
      }, {});
      setCategoryMap(map);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setError("Failed to load categories");
      setCategories([]);
      setCategoryMap({});
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get("/transactions/list");
      const normalized = (res.data || []).map((t) => ({
        ...t,
        _id: t._id || t.id,
      }));
      // sort newest first by createdAt (fallback to date field)
      normalized.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : (a.date ? new Date(a.date).getTime() : 0);
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : (b.date ? new Date(b.date).getTime() : 0);
        return bTime - aTime;
      });
      setTransactions(normalized);
      setFiltered(normalized);
      setError("");
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
      setError("Failed to load transactions");
      setTransactions([]);
      setFiltered([]);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    // eslint-disable-next-line
  }, []);

  // Clear error when popup shown
  useEffect(() => {
    if (showPopup) setError("");
  }, [showPopup]);

  // Helper: get display name for category (handles object/name/id)
  const getCategoryDisplay = (txn) => {
    if (!txn) return "";
    // case: txn.category may be object with .name
    if (typeof txn.category === "object" && txn.category?.name) {
      return txn.category.name;
    }
    // case: category is id -> lookup map
    if (categoryMap[txn.category]) {
      return categoryMap[txn.category];
    }
    // fallback: treat category as plain string
    return txn.category || "Uncategorized";
  };

  // Apply filter
  const applyFilter = (type) => {
    setFilterType(type);
    // filtering is computed centrally in computeFiltered via useEffect
  };

  const computeFiltered = () => {
    let list = [...(transactions || [])];
    // type filter
    if (filterType === 'income') list = list.filter(t => t.type === 'income');
    else if (filterType === 'expense') list = list.filter(t => t.type === 'expense');

    // time filter
    if (timeFilter === 'month') {
      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      list = list.filter(t => {
        const d = t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : null);
        return d && d.getMonth() === month && d.getFullYear() === year;
      });
    } else if (timeFilter === 'range' && startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      // include end day
      e.setHours(23,59,59,999);
      list = list.filter(t => {
        const d = t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : null);
        return d && d >= s && d <= e;
      });
    }

    setFiltered(list);
  };

  // Recompute filtered list when dependencies change
  useEffect(() => {
    computeFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, filterType, timeFilter, startDate, endDate]);

  // Add new transaction (called from TransactionForm)
  const handleTransactionAdded = (newTxn) => {
    if (!newTxn) return;
    const normalized = { ...newTxn, _id: newTxn._id || newTxn.id };
    // add to master list
    setTransactions((prev) => [normalized, ...(prev || [])]);

    // add to filtered only if matches filter
    setFiltered((prev) => {
      const matches =
        filterType === "all" ||
        (filterType === "income" && normalized.type === "income") ||
        (filterType === "expense" && normalized.type === "expense");
      if (matches) return [normalized, ...(prev || [])];
      return prev;
    });

    setPopupMessage("Transaction added!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
    // If the transaction references a category id we don't yet have, refresh categories
    if (normalized.category && !categoryMap[normalized.category]) {
      fetchCategories();
    }
  };

  // Called when TransactionForm creates a new category so we can update maps/lists here
  const handleCategoryCreated = (category) => {
    if (!category) return;
    const cat = { ...category, _id: category._id || category.id };
    setCategories(prev => [cat, ...(prev || [])]);
    setCategoryMap(prev => ({ ...(prev || {}), [cat._id]: cat.name }));
  };

  // Called when TransactionForm deletes a category - remove from dropdown but keep history
  const handleCategoryDeleted = ({ _id, name }) => {
    if (!_id) return;
    setCategories(prev => (prev || []).filter(c => c._id !== _id));
    setCategoryMap(prev => {
      const next = { ...(prev || {}) };
      delete next[_id];
      return next;
    });
    // Replace category id with name in local transactions so history still shows readable names
    setTransactions(prev => (prev || []).map(t => (t.category === _id ? { ...t, category: name } : t)));
    setFiltered(prev => (prev || []).map(t => (t.category === _id ? { ...t, category: name } : t)));
  };

  // Delete transaction
  const handleDelete = async (id) => {
    try {
      if (!id) {
        console.error("Missing transaction ID");
        return;
      }
      // confirm with user
      if (!window.confirm("Are you sure you want to delete this transaction?")) return;

      await axios.delete(`/transactions/${id}`);
      // remove locally
      setTransactions((prev) => prev.filter((t) => t._id !== id));
      setFiltered((prev) => prev.filter((t) => t._id !== id));
      setPopupMessage("Transaction deleted successfully!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (err) {
      console.error("Delete failed", err);
      setError(err.response?.data?.message || "Failed to delete transaction");
    }
  };

  // Edit flow: populate selectedTxn. Normalize category to an id if possible.
  const handleEdit = (txn) => {
    const t = { ...txn };
    // If category is name, try to find matching id
    if (t && typeof t.category === "string") {
      const found = categories.find((c) => c.name === t.category);
      if (found) t.category = found._id;
      // else keep the string (dropdown will show fallback)
    } else if (typeof t.category === "object" && t.category?.name) {
      // convert object to id if possible
      const found = categories.find((c) => c.name === t.category.name);
      if (found) t.category = found._id;
      else t.category = t.category.name; // fallback to name
    }
    setSelectedTxn(t);
    setIsEditing(true);
  };

  // Save edited transaction
  const handleSaveEdit = async () => {
    try {
      if (!selectedTxn?._id) throw new Error("Missing transaction ID");

      // Prepare payload: send category id if it looks like an id in categoryMap, else send string
      const categoryVal = selectedTxn.category;
      let categoryToSend = categoryVal;
      if (categoryVal && categoryMap[categoryVal]) {
        categoryToSend = categoryVal; // id
      } else if (typeof categoryVal === "string") {
        // maybe it's a name — send name
        categoryToSend = categoryVal;
      }

      const payload = {
        category: categoryToSend,
        amount: Number(selectedTxn.amount),
        description: selectedTxn.description,
        date: selectedTxn.date,
        type: selectedTxn.type,
      };

      const res = await axios.put(`/transactions/${selectedTxn._id}`, payload);
      const updated = { ...res.data, _id: res.data._id || res.data.id };

      // update local lists
      setTransactions((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      setFiltered((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));

      setIsEditing(false);
      setSelectedTxn(null);
      setPopupMessage("Transaction updated successfully!");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (err) {
      console.error("Update failed", err);
      setError(err.response?.data?.message || "Failed to update transaction");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6 bp-gradient-text">
          Add New Transaction
        </h2>

        <TransactionForm onTransactionAdded={handleTransactionAdded} onCategoryCreated={handleCategoryCreated} onCategoryDeleted={handleCategoryDeleted} />

        <h2 className="text-xl font-bold my-6 bp-gradient-text">History</h2>

        {/* Error / Popup */}
        {error && (
          <Card className="mb-4 p-3 border-l-4 border-red-500">
            <p className="text-red-600">{error}</p>
          </Card>
        )}
        {showPopup && !error && (
          <div className="fixed top-5 right-5 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            {popupMessage}
          </div>
        )}

        {/* Filters */}
        <div className="flex justify-center gap-3 mb-4">
          <Button
            onClick={() => applyFilter("all")}
            variant={filterType === "all" ? "primary" : "ghost"}
          >
            All
          </Button>
          <Button
            onClick={() => applyFilter("income")}
            variant={filterType === "income" ? "success" : "ghost"}
          >
            Income
          </Button>
          <Button
            onClick={() => applyFilter("expense")}
            variant={filterType === "expense" ? "danger" : "ghost"}
          >
            Expense
          </Button>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <label className="text-sm text-slate-900">Time:</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3 py-2 border border-blue-200 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
          >
            <option value="all">All</option>
            <option value="month">This Month</option>
            <option value="range">Date Range</option>
          </select>

          {timeFilter === 'range' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-slate-900">—</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400"
              />
            </div>
          )}
        </div>

        {/* Transaction List */}
        <Card className="p-4">
          {loading ? (
            <p className="text-center text-slate-600">Loading transactions...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-600">No transactions found.</p>
          ) : (
            <ul className="divide-y divide-blue-100" ref={listRef}>
              {filtered.map((txn, index) => (
                <li
                  key={txn._id || txn.id || index}
                  className="py-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium text-slate-900">{getCategoryDisplay(txn)}</p>
                    <p className="text-sm text-slate-600">{txn.description || "-"}</p>
                    <p className="text-xs text-slate-500">
                      {txn.date ? format(new Date(txn.date), "dd MMM yyyy") : "-"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className={`font-semibold ${
                        txn.type === "income" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {txn.type === "income" ? "+" : "-"}
                      {Number(txn.amount).toLocaleString()}
                    </p>

                    <div className="space-x-2 mt-1">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSelectedTxn(txn);
                          setIsEditing(false);
                        }}
                        className="text-slate-700 hover:text-slate-900 text-sm px-2 py-1"
                      >
                        View
                      </Button>

                      <Button 
                        variant="ghost"
                        onClick={() => handleEdit(txn)}
                        className="text-slate-700 hover:text-slate-900 text-sm px-2 py-1"
                      >
                        Edit
                      </Button>

                      <Button
                        variant="danger"
                        onClick={() => handleDelete(txn._id || txn.id)}
                        className="text-sm px-2 py-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Modal */}
        {selectedTxn && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
            <Card className="p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold mb-4 bp-gradient-text">{isEditing ? "Edit Transaction" : "Transaction Details"}</h3>

              <div className="space-y-3">
                {/* Category: show dropdown of user's categories OR fallback to simple input */}
                <div>
                  <label className="block text-sm font-medium text-slate-900">Category</label>

                  {/* If categories are available show dropdown (selectedTxn.category expected to be id or name) */}
                  {categories.length > 0 ? (
                    <select
                      value={selectedTxn.category ?? ""}
                      onChange={(e) => setSelectedTxn({ ...selectedTxn, category: e.target.value })}
                      disabled={!isEditing}
                      className="w-full border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                    >
                      <option value="">Select Category</option>
                      {categories
                        .filter((c) => c.type === selectedTxn.type)
                        .map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))}
                      {/* If category is a name (no id), include it as an option so it displays */}
                      {selectedTxn && typeof selectedTxn.category === "string" && !categoryMap[selectedTxn.category] ? (
                        <option value={selectedTxn.category}>{selectedTxn.category}</option>
                      ) : null}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={selectedTxn.category ?? ""}
                      onChange={(e) => setSelectedTxn({ ...selectedTxn, category: e.target.value })}
                      disabled={!isEditing}
                      className="w-full border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900">Amount</label>
                  <input
                    type="number"
                    value={selectedTxn.amount ?? ""}
                    onChange={(e) => setSelectedTxn({ ...selectedTxn, amount: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900">Description</label>
                  <textarea
                    value={selectedTxn.description || ""}
                    onChange={(e) => setSelectedTxn({ ...selectedTxn, description: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900">Type</label>
                  <select
                    value={selectedTxn.type}
                    onChange={(e) => setSelectedTxn({ ...selectedTxn, type: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900">Date</label>
                  <input
                    type="date"
                    value={selectedTxn.date ? new Date(selectedTxn.date).toISOString().slice(0, 10) : ""}
                    onChange={(e) => setSelectedTxn({ ...selectedTxn, date: e.target.value })}
                    disabled={!isEditing}
                    className="w-full border border-blue-200 p-2 rounded bg-white text-slate-900 focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-4">
                  {isEditing && (
                    <Button onClick={handleSaveEdit} variant="primary">
                      Save
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setSelectedTxn(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}