import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell
} from 'recharts'
import {
  TrendingUp,
  DollarSign,
  Target,
  Zap,
  Menu,
  RefreshCw,
  Plus,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react'
import CoachingInsightsCard from '../components/CoachingInsightsCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTransactionsData } from '../hooks/useTransactionsData.js'
import { fetchCoachingInsights, fetchFinancialGoals } from '../services/supabaseService.js'

const tabs = [
  { id: 'overview', label: 'Overview', icon: TrendingUp },
  { id: 'track', label: 'Track', icon: DollarSign },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'insights', label: 'AI Coach', icon: Zap }
]

const categoryPalette = ['#8b5cf6', '#22d3ee', '#f97316', '#a3e635', '#facc15', '#f472b6', '#38bdf8', '#fb7185']

function formatCategoryLabel(category = 'other') {
  return category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function buildMonthlySeries(transactions) {
  const now = new Date()
  const template = []
  for (let offset = 5; offset >= 0; offset -= 1) {
    const cursor = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}`
    template.push({ key, month: cursor.toLocaleString('en-US', { month: 'short' }), income: 0, expenses: 0 })
  }

  const map = Object.fromEntries(template.map((entry) => [entry.key, entry]))

  transactions.forEach((transaction) => {
    const transactionDate = new Date(transaction.date)
    const bucketKey = `${transactionDate.getFullYear()}-${transactionDate.getMonth()}`
    const bucket = map[bucketKey]
    if (!bucket) return
    if (transaction.type === 'income') {
      bucket.income += Number(transaction.amount) || 0
    } else {
      bucket.expenses += Number(transaction.amount) || 0
    }
  })

  return template
}

function buildCategorySeries(transactions) {
  const totals = transactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((acc, transaction) => {
      const key = transaction.category || 'other'
      acc[key] = (acc[key] || 0) + Number(transaction.amount || 0)
      return acc
    }, {})

  return Object.entries(totals).map(([category, value], index) => ({
    name: formatCategoryLabel(category),
    value,
    color: categoryPalette[index % categoryPalette.length]
  }))
}

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { transactions, stats, loading: transactionsLoading, error: transactionsError, refresh } = useTransactionsData(user?.id)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [coachingData, setCoachingData] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [insightsError, setInsightsError] = useState('')
  const [financialGoals, setFinancialGoals] = useState([])
  const [goalsLoading, setGoalsLoading] = useState(true)
  const [goalsError, setGoalsError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const loadInsights = useCallback(async () => {
    if (!user?.id) return
    setLoadingInsights(true)
    setInsightsError('')
    try {
      const result = await fetchCoachingInsights(user.id)
      setCoachingData(result)
    } catch (error) {
      setInsightsError(error.message || 'Unable to load insights.')
    } finally {
      setLoadingInsights(false)
    }
  }, [user?.id])

  const loadGoals = useCallback(async () => {
    if (!user?.id) return
    setGoalsLoading(true)
    setGoalsError('')
    try {
      const rows = await fetchFinancialGoals(user.id)
      setFinancialGoals(rows)
    } catch (error) {
      setGoalsError(error.message || 'Unable to load goals.')
    } finally {
      setGoalsLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadInsights()
  }, [loadInsights])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([refresh(), loadGoals(), loadInsights()])
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const healthScore = coachingData?.healthScore ?? 72
  const healthStatus = healthScore >= 70 ? 'healthy' : healthScore >= 50 ? 'neutral' : 'critical'
  const monthlyData = useMemo(() => buildMonthlySeries(transactions), [transactions])
  const categoryData = useMemo(() => buildCategorySeries(transactions), [transactions])
  const goalsWithProgress = useMemo(
    () =>
      financialGoals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        current: Number(goal.current_amount ?? 0),
        target: Number(goal.target_amount ?? 0),
        progress: goal.target_amount ? Math.min(Math.round((Number(goal.current_amount ?? 0) / Number(goal.target_amount)) * 100), 100) : 0
      })),
    [financialGoals]
  )

  return (
    <div className="dashboard">
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar--collapsed'}`}>
        <div className="sidebar__head">
          {sidebarOpen && (
            <div className="brand-mark">
              <TrendingUp size={22} />
              <span>Legend</span>
            </div>
          )}
          <button className="icon-btn" onClick={() => setSidebarOpen((prev) => !prev)}>
            <Menu size={18} />
          </button>
        </div>
        <nav className="sidebar__nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sidebar-link ${activeTab === tab.id ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              {sidebarOpen && <span>{tab.label}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          {sidebarOpen && (
            <div className="sidebar__footer-actions">
              <button className="btn btn-ghost btn-small">Settings</button>
              <button className="btn btn-ghost btn-small" onClick={handleSignOut} disabled={signingOut}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-panel">
        <header className="panel-header">
          <div>
            <h1>Your financial dashboard</h1>
            <p>AI-powered insights adapted to your lifestyle.</p>
          </div>
          <div className="header-actions">
            <button className={`icon-btn ${refreshing ? 'is-rotating' : ''}`} onClick={handleRefresh}>
              <RefreshCw size={18} />
            </button>
            <button className="btn btn-primary">
              <Plus size={16} />
              Log Transaction
            </button>
          </div>
        </header>

        <section className="cards-grid">
          <article className="card health-card">
            <div className="card-head">
              <p>Financial health</p>
            </div>
            <div className="health-score">
              <span className={`value ${healthStatus}`}>{healthScore}</span>
              <span className="suffix">/100</span>
            </div>
            <div className="progress">
              <span style={{ width: `${healthScore}%` }} />
            </div>
            <p className="muted">
              {healthStatus === 'healthy' && 'Great financial health!'}
              {healthStatus === 'neutral' && 'Solid base, keep optimizing.'}
              {healthStatus === 'critical' && 'Needs attention ASAP.'}
            </p>
          </article>

          <article className="card metric-card">
            <div className="card-head">
              <p>This month income</p>
            </div>
            <div className="metric">
              <span>{transactionsLoading ? '…' : `$${stats.totalIncome.toFixed(0)}`}</span>
              <div className="trend up">
                <ArrowUpRight size={16} />
                <span>12%</span>
              </div>
            </div>
          </article>

          <article className="card metric-card">
            <div className="card-head">
              <p>Expenses</p>
            </div>
            <div className="metric">
              <span className="danger">{transactionsLoading ? '…' : `$${stats.totalExpenses.toFixed(0)}`}</span>
              <div className="trend down">
                <ArrowDownLeft size={16} />
                <span>8%</span>
              </div>
            </div>
          </article>

          <article className="card metric-card">
            <div className="card-head">
              <p>Savings</p>
            </div>
            <div className="metric">
              <span>{transactionsLoading ? '…' : `$${Math.max(stats.netSavings, 0).toFixed(0)}`}</span>
              <p className="muted">52% of income</p>
            </div>
          </article>
        </section>

        {transactionsError && <p className="feedback feedback--error">{transactionsError}</p>}

        <div className="tab-list">
          {tabs.map((tab) => (
            <button key={tab.id} className={`tab-button ${activeTab === tab.id ? 'is-active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <section className="tab-panel">
            <article className="card chart-card">
              <div className="card-head">
                <h3>Income vs expenses</h3>
                <p className="muted">Last 6 months comparison</p>
              </div>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={320}>
                  <AreaChart data={monthlyData} margin={{ left: 0, right: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Area type="monotone" dataKey="income" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                    <Area type="monotone" dataKey="expenses" stroke="#f97316" fill="#f97316" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="card chart-card">
              <div className="card-head">
                <h3>Expense distribution</h3>
                <p className="muted">Current month by category</p>
              </div>
              <div className="chart-wrapper">
                {categoryData.length ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={90} label>
                        {categoryData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#11111a', border: '1px solid rgba(255,255,255,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="placeholder-card">
                    <p className="muted">Log expenses to see category insights.</p>
                  </div>
                )}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'track' && (
          <section className="tab-panel">
            <article className="card action-card">
              <div>
                <h3>Transaction tracker</h3>
                <p className="muted">Log income and expenses with advanced filters.</p>
              </div>
              <Link to="/dashboard/track" className="btn btn-primary">
                Open Tracker
              </Link>
            </article>
          </section>
        )}

        {activeTab === 'goals' && (
          <section className="tab-panel goal-grid">
            {goalsLoading && (
              <article className="card placeholder-card">
                <div className="spinner" />
                <p className="muted">Loading your goals…</p>
              </article>
            )}
            {!goalsLoading && goalsError && <p className="feedback feedback--error">{goalsError}</p>}
            {!goalsLoading && !goalsError && !goalsWithProgress.length && (
              <article className="card placeholder-card">
                <p className="muted">Create a financial goal to start tracking progress.</p>
              </article>
            )}
            {!goalsLoading && !goalsError &&
              goalsWithProgress.map((goal) => (
                <article key={goal.id} className="card">
                  <div className="card-head">
                    <h3>{goal.title}</h3>
                    <span className="muted">
                      ${goal.current} / ${goal.target || 0}
                    </span>
                  </div>
                  <div className="progress">
                    <span style={{ width: `${goal.progress}%` }} />
                  </div>
                  <p className="muted">{goal.progress}% complete</p>
                </article>
              ))}
          </section>
        )}

        {activeTab === 'insights' && (
          <section className="tab-panel insights">
            <div className="tab-panel__head">
              <h3>AI coaching recommendations</h3>
              {loadingInsights && <span className="muted">Analyzing your data…</span>}
            </div>
            {loadingInsights ? (
              <article className="card placeholder-card">
                <div className="spinner" />
                <p className="muted">Generating personalized insights…</p>
              </article>
            ) : insightsError ? (
              <article className="card placeholder-card">
                <p className="muted">{insightsError}</p>
              </article>
            ) : coachingData?.insights?.length ? (
              <div className="insight-stack">
                {coachingData.insights.map((insight, index) => (
                  <CoachingInsightsCard key={`${insight.title}-${index}`} insight={insight} />
                ))}
                {coachingData.budgetAdvice && (
                  <article className="card info-card">
                    <h4>30-day budget guidance</h4>
                    <p>{coachingData.budgetAdvice}</p>
                  </article>
                )}
                {coachingData.predictiveAlerts && (
                  <article className="card warning-card">
                    <h4>30-60 day outlook</h4>
                    <p>{coachingData.predictiveAlerts}</p>
                  </article>
                )}
              </div>
            ) : (
              <article className="card placeholder-card">
                <p className="muted">No insights yet. Start logging your transactions!</p>
              </article>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
