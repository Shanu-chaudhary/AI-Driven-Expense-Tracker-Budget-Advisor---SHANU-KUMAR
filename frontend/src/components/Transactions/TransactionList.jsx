// import React, { useEffect, useState } from "react";
// import axios from "../../api/axios";

// export default function TransactionList() {
//   const [transactions, setTransactions] = useState([]);

//   // const loadTransactions = async () => {
//   //   const token = localStorage.getItem("token");
//   //   const res = await axios.get("/transactions/list", {
//   //     headers: { Authorization: `Bearer ${token}` },
//   //   });
//   //   setTransactions(res.data);
//   // };

//   const loadTransactions = async () => {
//   const token = localStorage.getItem("token");
//   const res = await axios.get("/transactions/list", {
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   const formatted = res.data.map(txn => ({
//     ...txn,
//     date:
//       typeof txn.date === "string"
//         ? txn.date
//         : new Date(txn.date).toISOString(),
//   }));

//   setTransactions(formatted);
// };

//   const deleteTransaction = async (id) => {
//     const token = localStorage.getItem("token");
//     await axios.delete(`/transactions/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     loadTransactions();
//   };

//   useEffect(() => {
//     loadTransactions();
//   }, []);

//   return (
//     <div className="bg-white shadow-md rounded-lg p-4 border border-hunyadi_yellow-300">
//       <h3 className="text-xl font-semibold mb-4 text-light_sea_green-500">Transactions</h3>
//       <ul className="divide-y">
//         {transactions.map((txn) => (
//           <li key={txn.id} className="py-3 flex justify-between items-center">
//             <div>
//               <p className="font-medium">{txn.category}</p>
//               <p className="text-sm text-gray-500">
//   {txn.date
//     ? typeof txn.date === "string"
//       ? txn.date.split("T")[0]
//       : new Date(txn.date).toISOString().split("T")[0]
//     : "—"}
// </p>

//             </div>
//             <div className="flex items-center gap-4">
//               <p className={`font-semibold ${txn.type === "income" ? "text-green-600" : "text-red-600"}`}>
//                 ₹{txn.amount}
//               </p>
//               <button
//                 onClick={() => deleteTransaction(txn.id)}
//                 className="text-red-500 hover:text-red-700"
//               >
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }




// src/components/Transactions/TransactionList.jsx
// import React, { useEffect, useState } from "react";
// import axios from "../../api/axios";
// import { format } from "date-fns";

// export default function TransactionList({ refreshKey }) {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchTransactions = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("/transactions/list");
//       // backend returns array; map to consistent keys if needed
//       setTransactions(res.data || []);
//     } catch (err) {
//       console.error("Failed to load transactions", err);
//       setTransactions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTransactions();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [refreshKey]);

//   if (loading) return <div className="p-4 text-center text-gray-500">Loading transactions...</div>;

//   if (!transactions.length) {
//     return <div className="p-4 text-center text-gray-600">No transactions yet.</div>;
//   }

//     const deleteTransaction = async (id) => {
//     const token = localStorage.getItem("token");
//     await axios.delete(`/transactions/${id}`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     loadTransactions();
//   };

//   return (
//     <div className="bg-white shadow-md rounded-lg p-4 border border-hunyadi_yellow-200">
//       <h3 className="text-xl font-semibold mb-3 text-light_sea_green-500">Transactions</h3>
//       <ul className="divide-y">
//         {transactions.map((txn) => (
//           <li key={txn.id || txn._id} className="py-3 flex justify-between items-center">
//             <div>
//               <div className="flex items-center gap-3">
//                 <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${txn.type === "income" ? 'bg-mint_green-100 text-green-700' : 'bg-orange_peel-100 text-red-700'}`}>
//                   {txn.type === "income" ? "Income" : "Expense"}
//                 </span>
//                 <div>
//                   <p className="font-medium">{txn.category}</p>
//                   <p className="text-sm text-gray-500">{txn.description || "-"}</p>
//                 </div>
//               </div>
//             </div>

//             <div className="text-right">
//               <p className={`font-semibold ${txn.type === "income" ? "text-green-600" : "text-red-600"}`}>
//                 {txn.type === "income" ? "+" : "-"}{Number(txn.amount).toLocaleString()}
//               </p>
//               <p className="text-sm text-gray-500">{txn.date ? format(new Date(txn.date), "dd MMM yyyy") : ""}</p>
//               <button
//                  onClick={() => deleteTransaction(txn.id)}
//                  className="text-red-500 hover:text-red-700"
//                >
//                  Delete
//                </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }



// import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
// import axios from "../../api/axios";
// import { format } from "date-fns";

// const TransactionList = forwardRef((props, ref) => {
//   const [transactions, setTransactions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const fetchTransactions = async () => {
//     setLoading(true);
//     try {
//       const res = await axios.get("/transactions/list");
//       setTransactions(res.data || []);
//     } catch (err) {
//       console.error("Failed to load transactions", err);
//       setTransactions([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchTransactions();
//   }, []);

//   // Expose functions to parent (Dashboard)
//   useImperativeHandle(ref, () => ({
//     addTransactionToList(newTxn) {
//       // Optimistic UI: instantly show new transaction
//       setTransactions((prev) => [newTxn, ...prev]);
//     },
//     refreshTransactions() {
//       fetchTransactions();
//     },
//   }));

//   const handleDelete = async (id) => {
//     try {
//       await axios.delete(`/transactions/${id}`);
//       // Instantly remove from UI
//       setTransactions((prev) => prev.filter((t) => t.id !== id && t._id !== id));
//     } catch (err) {
//       console.error("Failed to delete transaction", err);
//       alert("Error deleting transaction");
//     }
//   };

//   if (loading)
//     return <div className="p-4 text-center text-gray-500">Loading transactions...</div>;

//   if (!transactions.length)
//     return <div className="p-4 text-center text-gray-600">No transactions yet.</div>;

//   return (
//     <div className="bg-white shadow-md rounded-lg p-4 border border-hunyadi_yellow-200">
//       <h3 className="text-xl font-semibold mb-3 text-light_sea_green-500">Transactions</h3>
//       <ul className="divide-y">
//         {transactions.map((txn) => (
//           <li key={txn.id || txn._id} className="py-3 flex justify-between items-center">
//             <div className="flex items-center gap-3">
//               <span
//                 className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
//                   txn.type === "income"
//                     ? "bg-mint_green-100 text-green-700"
//                     : "bg-orange_peel-100 text-red-700"
//                 }`}
//               >
//                 {txn.type}
//               </span>
//               <div>
//                 <p className="font-medium">{txn.category}</p>
//                 <p className="text-sm text-gray-500">{txn.description || "-"}</p>
//               </div>
//             </div>

//             <div className="text-right">
//               <p
//                 className={`font-semibold ${
//                   txn.type === "income" ? "text-green-600" : "text-red-600"
//                 }`}
//               >
//                 {txn.type === "income" ? "+" : "-"}
//                 {Number(txn.amount).toLocaleString()}
//               </p>
//               <p className="text-sm text-gray-500">
//                 {txn.date
//                   ? format(new Date(txn.date), "dd MMM yyyy")
//                   : ""}
//               </p>

//               {/* Delete Button */}
//               <button
//                 onClick={() => handleDelete(txn.id || txn._id)}
//                 className="text-red-500 text-sm mt-1 hover:underline"
//               >
//                 Delete
//               </button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// });

// export default TransactionList;



import React, { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import axios from "../../api/axios";
import { format } from "date-fns";

const TransactionList = forwardRef(({ limit }, ref) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/transactions/list");
      let data = res.data || [];
      if (limit) data = data.slice(0, limit);
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  useImperativeHandle(ref, () => ({
    addTransactionToList(newTxn) {
      setTransactions((prev) => [newTxn, ...prev].slice(0, limit || prev.length + 1));
    },
    refreshTransactions() {
      fetchTransactions();
    },
  }));

  if (loading) return <div className="text-center text-gray-500 py-4">Loading...</div>;
  if (!transactions.length) return <div className="text-center text-gray-500 py-4">No transactions yet.</div>;

  return (
    <div className="bg-white shadow-md rounded-lg p-4 border border-hunyadi_yellow-200">
      <h3 className="text-xl font-semibold mb-3 text-light_sea_green-500">Transactions</h3>
      <ul className="divide-y">
        {transactions.map((txn) => (
          <li key={txn._id || txn.id} className="py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  txn.type === "income"
                    ? "bg-mint_green-100 text-green-700"
                    : "bg-orange_peel-100 text-red-700"
                }`}
              >
                {txn.type}
              </span>
              <div>
                <p className="font-medium">{txn.category}</p>
                <p className="text-sm text-gray-500">{txn.description || "-"}</p>
              </div>
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
              <p className="text-sm text-gray-500">
                {txn.date ? format(new Date(txn.date), "dd MMM yyyy") : ""}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
});

export default TransactionList;
