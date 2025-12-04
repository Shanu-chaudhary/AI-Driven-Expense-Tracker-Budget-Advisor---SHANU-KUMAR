
// src/components/Transactions/TransactionForm.jsx
import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Input from "../ui/Input";

export default function TransactionForm({ onTransactionAdded, onCategoryCreated, onCategoryDeleted }) {
  const [formData, setFormData] = useState({
    type: "expense",
    category: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // categories fetched from backend (user-specific)
  const [categories, setCategories] = useState([]);
  const [creating, setCreating] = useState(false); // show create input
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // fetch user categories on mount & when type changes
  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get("/categories/list");
      // ensure _id present
      const normalized = (res.data || []).map(c => ({ ...c, _id: c.id || c._id }));
      setCategories(normalized);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  };

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError("");
  };

  const validate = () => {
    if (!formData.category) return "Please choose a category";
    if (!formData.amount || Number(formData.amount) <= 0) return "Amount must be greater than 0";
    if (!formData.date) return "Please select a date";
    return null;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setError("Category name cannot be empty");
      return;
    }
    setLoading(true);
    try {
      const payload = { name: newCategoryName.trim(), type: formData.type };
      const res = await axios.post("/categories/create", payload);
      const created = res.data;
      const normalized = { ...created, _id: created._id || created.id };

      // add to categories list and select it
      setCategories(prev => [normalized, ...(prev || [])]);
      setFormData(prev => ({ ...prev, category: normalized._id }));
      setNewCategoryName("");
      setCreating(false);

      // notify parent page so it can update categoryMap and lists there too
      if (onCategoryCreated) onCategoryCreated(normalized);
    } catch (err) {
      console.error("Create category failed", err);
      setError(err.response?.data?.message || "Failed to create category");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    setError("");
    try {
      // Ensure category exists in backend. If user selected a default/category name (not real _id), create it.
      let categoryToUse = formData.category;
      const exists = categories.some(c => c._id === formData.category || c.id === formData.category);
      if (!exists) {
        // categoryToUse may be a string name (default merged category). Create it on backend.
        const createPayload = { name: formData.category, type: formData.type };
        try {
          const createRes = await axios.post('/categories/create', createPayload);
          const created = createRes.data;
          const normalized = { ...created, _id: created._id || created.id };
          // update local categories and notify parent
          setCategories(prev => [normalized, ...(prev || [])]);
          categoryToUse = normalized._id;
          if (onCategoryCreated) onCategoryCreated(normalized);
        } catch (catErr) {
          console.error('Failed to auto-create category', catErr);
          // continue and let backend transaction endpoint possibly accept name; but show error
          setError('Failed to create category: ' + (catErr.response?.data?.message || catErr.message));
          setLoading(false);
          return;
        }
      }

      const payload = { ...formData, amount: Number(formData.amount), category: categoryToUse };
      const res = await axios.post("/transactions/add", payload);
      const createdTxn = res.data;
      if (onTransactionAdded) onTransactionAdded(createdTxn);
      // reset but keep type
      setFormData({
        type: formData.type,
        category: "",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        description: ""
      });
    } catch (err) {
      console.error("Error adding transaction", err);
      setError(err.response?.data?.message || "Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  // filter categories for current type
  const filteredCategories = categories.filter(c => c.type === formData.type);

  // Default/common categories (fallback options users can pick quickly)
  const DEFAULT_INCOME = ["Salary", "Freelance", "Investment", "Interest", "Bonus", "Other"];
  const DEFAULT_EXPENSE = ["Rent", "Food", "Transport", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other"];

  // Merge fetched categories with defaults (show fetched first, then defaults that aren't duplicated by name)
  const defaultList = formData.type === "income" ? DEFAULT_INCOME : DEFAULT_EXPENSE;
  const mergedCategories = [
    ...filteredCategories,
    ...defaultList
      .filter(d => !filteredCategories.some(fc => (fc.name || fc) === d))
      .map(d => ({ _id: d, name: d, type: formData.type })),
  ];

  const handleDeleteCategory = async (cat) => {
    if (!cat || !cat._id) return;
    if (!window.confirm(`Delete category '${cat.name}'? This will remove it from your category list but transactions will remain.`)) return;
    try {
      await axios.delete(`/categories/${cat._id}`);
      // remove from local list and notify parent
      setCategories(prev => (prev || []).filter(c => c._id !== cat._id));
      if (typeof onCategoryDeleted === 'function') onCategoryDeleted({ _id: cat._id, name: cat.name });
      // if the currently selected category was deleted, clear selection
      setFormData(prev => (prev.category === cat._id ? { ...prev, category: "" } : prev));
      setError("");
    } catch (err) {
      console.error('Failed to delete category', err);
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <Card className="mb-4 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="mb-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
        <select
          value={formData.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="col-span-1 bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <div className="relative col-span-2">
          <div className="flex">
            <input
              type="text"
              placeholder="Search or select category"
              value={
                (() => {
                  const sel = formData.category;
                  if (!sel) return searchQuery;
                  const found = categories.find(c => c._id === sel || c.id === sel);
                  if (found) return found.name;
                  return sel;
                })()
              }
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
                if (formData.category) handleChange('category', '');
              }}
              onFocus={() => setDropdownOpen(true)}
              className="bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-l-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400"
            />
            <button type="button" onClick={() => { setCreating(true); setDropdownOpen(false); }} className="border border-l-0 border-blue-200 px-3 py-2 rounded-r-lg bg-blue-600 hover:bg-blue-700 text-white transition">+</button>
          </div>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-blue-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              <div className="p-2">
                <input className="w-full bg-white border border-blue-200 text-slate-900 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400" placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <ul>
                {mergedCategories.filter(c => (c.name || '').toLowerCase().includes((searchQuery||'').toLowerCase())).map(c => (
                  <li key={c._id} className="flex justify-between items-center px-3 py-2 hover:bg-blue-50 border-b border-blue-100 last:border-b-0">
                    <button type="button" onClick={() => { handleChange('category', c._id); setDropdownOpen(false); setSearchQuery(''); }} className="text-left flex-1 text-slate-900 hover:text-blue-600">{c.name}</button>
                    {categories.find(ct => ct._id === c._id) ? (
                      <button type="button" onClick={() => handleDeleteCategory(c)} className="ml-2 text-red-400 hover:text-red-300 px-2 text-sm">Delete</button>
                    ) : null}
                  </li>
                ))}
                <li className="px-3 py-2 border-t border-blue-100">
                  <button type="button" onClick={() => { setCreating(true); setDropdownOpen(false); }} className="w-full text-left text-blue-600 hover:text-blue-700">+ Add new category</button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Show inline create input when user selects add new */}
        {formData.category === "__add_new__" || creating ? (
          <div className="col-span-3 flex items-center gap-2">
            <input
              type="text"
              placeholder={`New ${formData.type} category`}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400"
            />
            <Button size="sm" onClick={handleCreateCategory} disabled={loading}>
              {loading ? "Saving..." : "Create"}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setCreating(false); setNewCategoryName(""); setFormData(prev => ({ ...prev, category: "" })) }}>
              Cancel
            </Button>
          </div>
        ) : null}

        <input type="number" step="0.01" placeholder="Amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} className="col-span-1 bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400" required />

        <input type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} className="col-span-1 bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer" required />

        <input type="text" placeholder="Description (optional)" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} className="col-span-1 bg-white border border-blue-200 text-slate-900 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-slate-400" />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Adding..." : "Add Transaction"}
        </Button>
      </form>
    </Card>
  );
}
