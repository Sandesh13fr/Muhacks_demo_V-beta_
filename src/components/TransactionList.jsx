const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

const formatCategory = (category) =>
  category
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

export default function TransactionList({ transactions, onDelete }) {
  if (!transactions.length) {
    return (
      <article className="card placeholder-card">
        <p className="muted">No transactions to display.</p>
      </article>
    )
  }

  const grouped = transactions.reduce((acc, transaction) => {
    if (!acc[transaction.date]) acc[transaction.date] = []
    acc[transaction.date].push(transaction)
    return acc
  }, {})

  const orderedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="transaction-groups">
      {orderedDates.map((date) => (
        <div key={date} className="transaction-group">
          <h4>{formatDate(date)}</h4>
          <div className="transaction-list">
            {grouped[date].map((transaction) => (
              <article key={transaction.id} className="card transaction-card">
                <div>
                  <p className="transaction-card__title">
                    {transaction.description || transaction.source || formatCategory(transaction.category)}
                  </p>
                  <p className="muted">{formatCategory(transaction.category)}</p>
                </div>
                <div className="transaction-card__meta">
                  <span className={transaction.type === 'income' ? 'success' : 'danger'}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </span>
                  <button className="btn btn-ghost btn-small" onClick={() => onDelete(transaction.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
