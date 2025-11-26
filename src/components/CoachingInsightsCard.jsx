import { AlertCircle, Lightbulb, TrendingUp, Zap } from 'lucide-react'

const iconMap = {
  opportunity: Lightbulb,
  alert: AlertCircle,
  congratulation: TrendingUp,
  prediction: Zap
}

const priorityClass = {
  urgent: 'badge badge--danger',
  high: 'badge badge--warn',
  medium: 'badge badge--info',
  low: 'badge'
}

const cardTone = {
  alert: 'insight-card insight-card--alert',
  congratulation: 'insight-card insight-card--success',
  opportunity: 'insight-card insight-card--primary',
  prediction: 'insight-card insight-card--prediction'
}

export default function CoachingInsightsCard({ insight }) {
  const Icon = iconMap[insight.type] || Lightbulb
  const badgeClass = priorityClass[insight.priority] || 'badge'
  const tone = cardTone[insight.type] || 'insight-card'

  return (
    <article className={`card ${tone}`}>
      <header className="insight-card__head">
        <div className="icon-pill">
          <Icon size={18} />
        </div>
        <div className="insight-card__title">
          <h4>{insight.title}</h4>
          <span className={badgeClass}>{insight.priority}</span>
        </div>
      </header>
      <p className="muted">{insight.description}</p>
      <dl className="insight-details">
        <div>
          <dt>What to do</dt>
          <dd>{insight.actionableAdvice}</dd>
        </div>
        <div>
          <dt>Expected outcome</dt>
          <dd>{insight.expectedOutcome}</dd>
        </div>
        <div>
          <dt>Timeframe</dt>
          <dd>{insight.timeframe}</dd>
        </div>
      </dl>
      <footer className="insight-card__footer">
        <small>Confidence: {(insight.confidenceScore * 100).toFixed(0)}%</small>
      </footer>
    </article>
  )
}
