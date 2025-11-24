import React, { useEffect, useState } from 'react'
import DashboardLayout from '../components/Layout/DashboardLayout'
import axios from '../api/axios'

// Simple utilities
const STORAGE_BUDGETS = 'budgets_v1'
const STORAGE_GOALS = 'savings_goals_v1'

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`
}

function readBudgets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_BUDGETS) || '{}') } catch(e){ return {} }
}
function writeBudgets(obj){ localStorage.setItem(STORAGE_BUDGETS, JSON.stringify(obj)) }

function readGoals(){
  try { return JSON.parse(localStorage.getItem(STORAGE_GOALS) || '[]') } catch(e){ return [] }
}
function writeGoals(arr){ localStorage.setItem(STORAGE_GOALS, JSON.stringify(arr)) }

export default function BudgetPage(){
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgets, setBudgets] = useState(() => readBudgets())
  const [goals, setGoals] = useState(() => readGoals())
  const [month, setMonth] = useState(monthKey())
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [catTypeFilter, setCatTypeFilter] = useState('expense') // show only expense budgets
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCategoryBudget, setSelectedCategoryBudget] = useState('')

  useEffect(()=>{ fetchData() }, [])

  async function fetchData(){
    setLoading(true)
    try{
      const [catRes, txnRes] = await Promise.all([
        axios.get('/categories/list'),
        axios.get('/transactions/list')
      ])
      const cats = (catRes.data || []).map(c => ({ _id: c._id || c.id, name: c.name, type: c.type }))
      const txns = (txnRes.data || []).map(t => ({ _id: t._id || t.id, amount: Number(t.amount), category: t.category, date: t.date, type: t.type }))
      setCategories(cats)
      setTransactions(txns)
      setError('')
    }catch(err){
      console.error('Failed loading budget data', err)
      setError('Failed to load data')
    }finally{ setLoading(false) }
  }

  // compute spent per category for selected month
  function computeSpentMap(){
    const map = {}
    const [y,m] = month.split('-').map(Number)
    transactions.forEach(t => {
      const d = t.date ? new Date(t.date) : (t.createdAt ? new Date(t.createdAt) : null)
      if(!d) return
      if(d.getFullYear() !== y || (d.getMonth()+1) !== m) return
      const cat = t.category || 'Uncategorized'
      map[cat] = (map[cat] || 0) + Number(t.amount || 0)
    })
    return map
  }

  const spent = computeSpentMap()

  // default lists used when backend has no category for a name
  const DEFAULT_INCOME = ["Salary","Freelance","Investment","Interest","Bonus","Other"]
  const DEFAULT_EXPENSE = ["Rent","Food","Transport","Travel","Shopping","Bills","Entertainment","Health","Education","Other"]

  // Build merged category list similar to TransactionForm behavior
  const filteredCategories = categories.filter(c => catTypeFilter === 'all' ? true : c.type === catTypeFilter)
  const defaultList = catTypeFilter === 'income' ? DEFAULT_INCOME : (catTypeFilter === 'expense' ? DEFAULT_EXPENSE : [...DEFAULT_INCOME, ...DEFAULT_EXPENSE])

  // merge and dedupe by name (backend categories first)
  const mergedMap = new Map()
  filteredCategories.forEach(c => {
    const name = (c.name || '').trim()
    if (!mergedMap.has(name)) mergedMap.set(name, { _id: c._id || c.id || name, name, type: c.type })
  })
  defaultList.forEach(d => {
    const name = (d || '').trim()
    if (!mergedMap.has(name)) mergedMap.set(name, { _id: name, name, type: DEFAULT_INCOME.includes(d) ? 'income' : 'expense' })
  })
  const mergedCategories = Array.from(mergedMap.values())

  // keep selectedCategoryBudget in sync when selection or month changes
  useEffect(() => {
    if (!selectedCategory) { setSelectedCategoryBudget(''); return }
    const id = selectedCategory
    const b = budgetFor(id)
    setSelectedCategoryBudget(b)
  }, [selectedCategory, month])

  // clear selected category when type filter changes to avoid mismatched selection
  useEffect(() => {
    setSelectedCategory('')
  }, [catTypeFilter])

  function handleBudgetChange(categoryId, value){
    const next = { ...(budgets || {}) }
    if(!next[month]) next[month] = {}
    next[month][categoryId] = Number(value || 0)
    setBudgets(next)
    writeBudgets(next)
  }

  function handleAddGoal(goal){
    const next = [goal, ...goals]
    setGoals(next); writeGoals(next)
  }
  function handleUpdateGoal(updated){
    const next = goals.map(g => g.id === updated.id ? updated : g)
    setGoals(next); writeGoals(next)
  }
  function handleDeleteGoal(id){
    const next = goals.filter(g => g.id !== id)
    setGoals(next); writeGoals(next)
  }

  // helper to get budget for category in month
  function budgetFor(catId){
    return (budgets && budgets[month] && budgets[month][catId]) ? budgets[month][catId] : 0
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h2 className="text-2xl font-bold text-light_sea_green-600 mb-4">Budget & Savings</h2>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm">Month:</label>
          <input type="month" value={month} onChange={(e)=>setMonth(e.target.value)} className="border p-2 rounded" />
          <button onClick={fetchData} className="ml-4 px-3 py-2 bg-light_sea_green-500 text-white rounded">Refresh</button>
        </div>

        

        {/* Per-category budget setter */}
        <div className="mb-6 bg-white border rounded p-4">
          <h4 className="font-medium mb-2">Set budget for a category</h4>
          <div className="flex items-center gap-3">
            <label className="text-sm">Category:</label>
            <select value={selectedCategory} onChange={(e)=>setSelectedCategory(e.target.value)} className="border p-2 rounded w-64">
              <option value="">-- pick category --</option>
              {mergedCategories.map(c => (
                <option key={c._id} value={c._id}>{c.name} {c.type ? `(${c.type})` : ''}</option>
              ))}
            </select>

            <label className="text-sm">Budget:</label>
            <input type="number" min="0" value={selectedCategoryBudget} onChange={(e)=>setSelectedCategoryBudget(e.target.value)} className="border p-2 rounded w-32" />

            <button onClick={() => {
              if (!selectedCategory) return alert('Select a category first')
              const v = Number(selectedCategoryBudget || 0)
              if (isNaN(v) || v < 0) return alert('Enter valid non-negative number')
              handleBudgetChange(selectedCategory, v)
              alert('Budget saved for category')
            }} className="px-3 py-2 bg-light_sea_green-500 text-white rounded">Save</button>
          </div>
          {selectedCategory && (
            <div className="text-sm text-gray-600 mt-2">Spent this month: {(spent[selectedCategory]||0).toLocaleString()}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-3">Category Budgets</h3>
            {loading ? <p>Loading...</p> : (
              <div className="space-y-3">
                {mergedCategories.length === 0 && <p className="text-sm text-gray-500">No expense categories yet.</p>}
                {mergedCategories.map(cat => {
                  // Only show expense categories here
                  if (cat.type !== 'expense') return null
                  const id = cat._id || cat.name
                  const b = budgetFor(id)
                  const s = spent[id] || 0
                  const remaining = (b - s)
                  const pct = b > 0 ? Math.max(0, Math.min(100, Math.round((s/b)*100))) : 0
                  return (
                    <div key={id} className="flex items-center justify-between gap-3 border-b pb-2">
                      <div className="flex-1">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-xs text-gray-500">Spent: {s.toLocaleString()} • Budget: {b.toLocaleString()}</div>
                        <div className="w-full bg-gray-100 rounded h-2 mt-2 overflow-hidden">
                          <div style={{width: `${pct}%`}} className={`h-2 ${pct>80 ? 'bg-red-500' : 'bg-light_sea_green-500'}`}></div>
                        </div>
                      </div>
                      <div className="w-40">
                        <input type="number" min="0" value={b} onChange={(e)=>handleBudgetChange(id, e.target.value)} className="border p-2 rounded w-full" />
                        <div className="text-xs text-gray-600 mt-1">Remaining: {remaining.toLocaleString()}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="bg-white border rounded p-4">
            <h3 className="font-semibold mb-3">Savings Goals</h3>
            <SavingsGoals goals={goals} onAdd={handleAddGoal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} />
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}

function SavingsGoals({ goals, onAdd, onUpdate, onDelete }){
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saved, setSaved] = useState('')

  function add(){
    if(!name || !target) return
    const g = { id: 'g_'+Date.now(), name, target: Number(target), saved: Number(saved||0), createdAt: new Date().toISOString() }
    onAdd(g)
    setName(''); setTarget(''); setSaved('')
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        <input placeholder="Goal name" className="w-full border p-2 rounded" value={name} onChange={(e)=>setName(e.target.value)} />
        <div className="flex gap-2">
          <input placeholder="Target amount" type="number" className="border p-2 rounded w-1/2" value={target} onChange={(e)=>setTarget(e.target.value)} />
          <input placeholder="Current saved" type="number" className="border p-2 rounded w-1/2" value={saved} onChange={(e)=>setSaved(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <button onClick={add} className="px-3 py-2 bg-orange_peel-500 text-white rounded">Add Goal</button>
        </div>
      </div>

      <div className="space-y-3">
        {goals.length === 0 && <p className="text-sm text-gray-500">No savings goals. Add one above.</p>}
        {goals.map(g => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.saved/g.target)*100)) : 0
          return (
            <div key={g.id} className="border p-2 rounded">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{g.name}</div>
                  <div className="text-xs text-gray-500">Saved: {Number(g.saved).toLocaleString()} / {Number(g.target).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{pct}%</div>
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded h-2 mt-2 overflow-hidden">
                <div style={{width: `${pct}%`}} className={`h-2 ${pct>80 ? 'bg-light_sea_green-500' : 'bg-light_sea_green-500'}`}></div>
              </div>

              <div className="mt-2 flex gap-2">
                <button onClick={() => {
                  const val = Number(prompt('Update saved amount', String(g.saved || 0)) || 0)
                  if(!isNaN(val)) onUpdate({ ...g, saved: val })
                }} className="px-2 py-1 border rounded">Update</button>
                <button onClick={() => { if(window.confirm('Delete goal?')) onDelete(g.id) }} className="px-2 py-1 border rounded text-red-500">Delete</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
