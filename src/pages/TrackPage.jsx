import { useMemo, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Plus, Search, Download } from 'lucide-react'
import TransactionForm from '../components/TransactionForm.jsx'
import TransactionList from '../components/TransactionList.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTransactionsData } from '../hooks/useTransactionsData.js'
import { createTransaction, deleteTransaction } from '../services/supabaseService.js'

const incomeCategories = ['gig_work', 'salary', 'freelance', 'business', 'other']
const expenseCategories = ['food', 'transport', 'utilities', 'entertainment', 'health', 'savings', 'debt', 'other']

export default function TrackPage() {
  const { user } = useAuth()
  const { transactions, stats, loading, error } = useTransactionsData(user?.id)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [actionError, setActionError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesType = filterType === 'all' || transaction.type === filterType
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory
      const matchesSearch =
        !searchQuery ||
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.source?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesType && matchesCategory && matchesSearch
    })
  }, [transactions, filterType, filterCategory, searchQuery])

  const netSavings = stats.netSavings

  const handleAddTransaction = async (transaction) => {
    if (!user?.id) return
    setSubmitting(true)
    setActionError('')
    try {
      await createTransaction(user.id, {
        ...transaction,
        amount: Number(transaction.amount),
        date: new Date().toISOString().split('T')[0]
      })
      setIsFormOpen(false)
    } catch (mutationError) {
      setActionError(mutationError.message || 'Unable to add transaction.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTransaction = async (id) => {
    if (!user?.id) return
    setActionError('')
    try {
      await deleteTransaction(id, user.id)
    } catch (mutationError) {
      setActionError(mutationError.message || 'Unable to delete transaction.')
    }
  }

  return (
    <div className="track-page">
      <div className="panel-header">
        <div>
          <h1>Track finances</h1>
          <p className="muted">Log income and expenses with full context.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      <section className="cards-grid">
        <article className="card metric-card">
          <p>Total income</p>
          <div className="metric">
            <span>{loading ? '…' : `$${stats.totalIncome.toFixed(2)}`}</span>
            <ArrowUpRight size={16} className="icon-success" />
          </div>
        </article>
        <article className="card metric-card">
          <p>Total expenses</p>
          <div className="metric">
            <span className="danger">{loading ? '…' : `$${stats.totalExpenses.toFixed(2)}`}</span>
            <ArrowDownLeft size={16} className="icon-danger" />
          </div>
        </article>
        <article className="card metric-card">
          <p>Net savings</p>
          <div className="metric">
            <span className={netSavings >= 0 ? '' : 'danger'}>{loading ? '…' : `$${netSavings.toFixed(2)}`}</span>
          </div>
        </article>
      </section>

      {(error || actionError) && <p className="feedback feedback--error">{actionError || error}</p>}

      <section className="card filter-card">
        <div className="filters">
          <label className="form-field">
            <span>Search</span>
            <div className="input-with-icon">
              <Search size={16} />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search description or source"
              />
            </div>
          </label>
          <label className="form-field">
            <span>Type</span>
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="all">All transactions</option>
              <option value="income">Income only</option>
              <option value="expense">Expenses only</option>
            </select>
          </label>
          <label className="form-field">
            <span>Category</span>
            <select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}>
              <option value="all">All categories</option>
              {(filterType === 'all' || filterType === 'income') &&
                incomeCategories.map((category) => (
                  <option key={`income-${category}`} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
              {(filterType === 'all' || filterType === 'expense') &&
                expenseCategories.map((category) => (
                  <option key={`expense-${category}`} value={category}>
                    {category.replace('_', ' ')}
                  </option>
                ))}
            </select>
          </label>
          <div className="download">
            <button className="icon-btn" title="Export CSV">
              <Download size={18} />
            </button>
          </div>
        </div>
      </section>

      <div className="tab-list">
        {['all', 'income', 'expense'].map((tab) => (
          <button key={tab} className={`tab-button ${activeTab === tab ? 'is-active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'all' && `All (${filteredTransactions.length})`}
            {tab === 'income' && `Income (${transactions.filter((t) => t.type === 'income').length})`}
            {tab === 'expense' && `Expenses (${transactions.filter((t) => t.type === 'expense').length})`}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {loading ? (
          <article className="card placeholder-card">
            <div className="spinner" />
            <p className="muted">Loading transactions…</p>
          </article>
        ) : (
          <TransactionList
            transactions={
              activeTab === 'all'
                ? filteredTransactions
                : filteredTransactions.filter((transaction) => transaction.type === activeTab)
            }
            onDelete={handleDeleteTransaction}
          />
        )}
      </div>

      {isFormOpen && (
        <div className="modal">
          <div className="modal__dialog">
            <div className="modal__head">
              <h3>Add transaction</h3>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}>
                X
              </button>
            </div>
            <TransactionForm
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
              onSubmit={handleAddTransaction}
              isSubmitting={submitting}
              onClose={() => setIsFormOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
