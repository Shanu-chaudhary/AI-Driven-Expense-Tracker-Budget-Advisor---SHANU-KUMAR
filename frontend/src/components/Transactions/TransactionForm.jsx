
// src/components/Transactions/TransactionForm.jsx
import React, { useState, useEffect } from "react";
import axios from "../../api/axios";

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
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-4 mb-4 border border-mint_green-300">
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={formData.type}
          onChange={(e) => handleChange("type", e.target.value)}
          className="border p-2 rounded w-36"
        >
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <div className="relative w-64">
          <div className="flex">
            <input
              type="text"
              placeholder="Search or select category"
              value={
                // show name when id selected
                (() => {
                  const sel = formData.category;
                  if (!sel) return searchQuery;
                  const found = categories.find(c => c._id === sel || c.id === sel);
                  if (found) return found.name;
                  // maybe it's a default name
                  return sel;
                })()
              }
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setDropdownOpen(true);
                // clear selection when typing
                if (formData.category) handleChange('category', '');
              }}
              onFocus={() => setDropdownOpen(true)}
              className="border p-2 rounded-l w-full"
            />
            <button type="button" onClick={() => { setCreating(true); setDropdownOpen(false); }} className="border p-2 rounded-r bg-orange_peel-500 text-white">+</button>
          </div>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full bg-white border rounded shadow max-h-60 overflow-auto">
              <div className="p-2">
                <input className="w-full border p-1 rounded" placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <ul>
                {mergedCategories.filter(c => (c.name || '').toLowerCase().includes((searchQuery||'').toLowerCase())).map(c => (
                  <li key={c._id} className="flex justify-between items-center p-2 hover:bg-gray-50">
                    <button type="button" onClick={() => { handleChange('category', c._id); setDropdownOpen(false); setSearchQuery(''); }} className="text-left flex-1">{c.name}</button>
                    {/* allow deletion for real backend categories (those with an id different from their name) */}
                    {categories.find(ct => ct._id === c._id) ? (
                      <button type="button" onClick={() => handleDeleteCategory(c)} className="ml-2 text-red-500 px-2">Delete</button>
                    ) : null}
                  </li>
                ))}
                <li className="p-2 border-t">
                  <button type="button" onClick={() => { setCreating(true); setDropdownOpen(false); }} className="w-full text-left text-orange_peel-500">+ Add new category</button>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Show inline create input when user selects add new */}
        {formData.category === "__add_new__" || creating ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder={`New ${formData.type} category`}
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="border p-2 rounded"
            />
            <button type="button" onClick={handleCreateCategory}
              className="px-3 py-2 bg-orange_peel-500 text-white rounded hover:bg-orange_peel-600">
              {loading ? "Saving..." : "Create"}
            </button>
            <button type="button" onClick={() => { setCreating(false); setNewCategoryName(""); setFormData(prev => ({ ...prev, category: "" })) }} className="px-2 py-1 border rounded">
              Cancel
            </button>
          </div>
        ) : null}

        <input type="number" step="0.01" placeholder="Amount" value={formData.amount} onChange={(e) => handleChange("amount", e.target.value)} className="border p-2 rounded w-28" required />

        <input type="date" value={formData.date} onChange={(e) => handleChange("date", e.target.value)} className="border p-2 rounded" required />

        <input type="text" placeholder="Description (optional)" value={formData.description} onChange={(e) => handleChange("description", e.target.value)} className="border p-2 rounded flex-1 min-w-[180px]" />

        <button type="submit" disabled={loading} className={`px-4 py-2 rounded ${loading ? 'bg-orange_peel-400 cursor-not-allowed' : 'bg-orange_peel-500 hover:bg-orange_peel-600 text-white'}`}>
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </form>
  );
}
