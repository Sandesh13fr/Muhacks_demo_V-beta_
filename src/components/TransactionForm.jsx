import { useState } from 'react'

export default function TransactionForm({ incomeCategories, expenseCategories, onSubmit, onClose, isSubmitting = false }) {
  const [type, setType] = useState('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [source, setSource] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState('monthly')

  const categories = type === 'income' ? incomeCategories : expenseCategories

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!amount || !category) {
      alert('Amount and category are required.')
      return
    }

    onSubmit({
      type,
      amount: Number.parseFloat(amount),
      category,
      description,
      source: type === 'income' ? source : undefined,
      is_recurring: type === 'expense' ? isRecurring : false,
      recurring_frequency: type === 'expense' && isRecurring ? frequency : undefined
    })

    setAmount('')
    setCategory('')
    setDescription('')
    setSource('')
    setIsRecurring(false)
    setFrequency('monthly')
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="type-toggle">
        {['income', 'expense'].map((current) => (
          <button
            type="button"
            key={current}
            className={`toggle ${type === current ? 'is-active' : ''}`}
            onClick={() => {
              setType(current)
              setCategory('')
            }}
          >
            {current}
          </button>
        ))}
      </div>

      <label className="form-field">
        <span>Amount</span>
        <div className="input-with-prefix">
          <span>$</span>
          <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </div>
      </label>

      <label className="form-field">
        <span>Category</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)} required>
          <option value="" disabled>
            Select category
          </option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace('_', ' ')}
            </option>
          ))}
        </select>
      </label>

      <label className="form-field">
        <span>Description</span>
        <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What was this for?" />
      </label>

      {type === 'income' && (
        <label className="form-field">
          <span>Source</span>
          <input value={source} onChange={(event) => setSource(event.target.value)} placeholder="e.g., Fiverr, Client" />
        </label>
      )}

      {type === 'expense' && (
        <>
          <label className="checkbox-field">
            <input type="checkbox" checked={isRecurring} onChange={(event) => setIsRecurring(event.target.checked)} />
            <span>This is a recurring expense</span>
          </label>
          {isRecurring && (
            <label className="form-field">
              <span>Frequency</span>
              <select value={frequency} onChange={(event) => setFrequency(event.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </label>
          )}
        </>
      )}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Add Transaction'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
