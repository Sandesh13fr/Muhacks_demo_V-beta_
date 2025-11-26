import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, TrendingUp, LineChart, Zap, Target } from 'lucide-react'

const features = [
  {
    icon: LineChart,
    title: 'Income Variability',
    description: 'Adapts to unpredictable pay cycles so gig workers always see the full picture.'
  },
  {
    icon: Zap,
    title: 'Smart Insights',
    description: 'AI spots spending patterns and nudges you with small, doable improvements.'
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Define savings goals and get progress benchmarks tailored to your habits.'
  },
  {
    icon: TrendingUp,
    title: 'Proactive Coaching',
    description: 'Get alerts before things go off track so you can course-correct with confidence.'
  }
]

const steps = [
  {
    step: '01',
    title: 'Connect Your Data',
    description: 'Log income and expenses once and Legend learns what "normal" looks like.'
  },
  {
    step: '02',
    title: 'Get AI Coaching',
    description: 'Receive context-aware guidance built around your actual cashflow volatility.'
  },
  {
    step: '03',
    title: 'Take Action',
    description: 'Follow practical nudges, track milestones, and build resilience over time.'
  }
]

const footerColumns = [
  {
    title: 'Product',
    links: ['Features', 'How It Works', 'Privacy']
  },
  {
    title: 'Company',
    links: ['About', 'Contact', 'Terms']
  },
  {
    title: 'Resources',
    links: ['Blog', 'Guides', 'FAQ']
  }
]

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="page landing-page">
      <header className={`landing-header ${isScrolled ? 'landing-header--scrolled' : ''}`}>
        <div className="landing-header__inner">
          <div className="brand-mark">
            <TrendingUp size={24} />
            <span>Legend</span>
          </div>
          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link to="/login">Login</Link>
          </nav>
          <Link className="btn btn-primary" to="/signup">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">AI FINANCIAL COACH FOR REAL LIFE</p>
          <h1>Finance without the middleman</h1>
          <p className="lede">
            Meet Legend &mdash; an AI coach that adjusts to income swings, busy side hustles, and everyday goals.
            Built for gig workers, informal earners, and anyone who wants less stress around money.
          </p>
          <div className="hero__actions">
            <Link to="/signup" className="btn btn-primary">
              Start Your Journey
              <ArrowRight size={16} />
            </Link>
            <a href="#features" className="btn btn-ghost">
              Learn More
            </a>
          </div>
        </section>

        <section id="features" className="section surface">
          <div className="section-heading">
            <h2>Intelligent financial coaching</h2>
            <p>Legend adapts to how you earn, spend, and plan so the advice always fits.</p>
          </div>
          <div className="feature-grid">
            {features.map((feature) => (
              <article key={feature.title} className="card feature-card">
                <div className="icon-pill">
                  <feature.icon size={20} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="section">
          <div className="section-heading">
            <h2>How it works</h2>
            <p>Three simple steps to build financial momentum.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step) => (
              <article key={step.step} className="card step-card">
                <span className="step">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section cta">
          <div className="cta__content">
            <h2>Ready to take control?</h2>
            <p>Join thousands of people using AI guidance to level-up their finances.</p>
            <Link to="/signup" className="btn btn-primary">
              Create Your Account
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top">
          <div>
            <div className="brand-mark">
              <TrendingUp size={20} />
              <span>Legend</span>
            </div>
            <p>Your AI financial coach for the real world.</p>
          </div>
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h4>{column.title}</h4>
              <ul>
                {column.links.map((link) => (
                  <li key={link}>
                    <a href="#">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="footer-bottom">&copy; {new Date().getFullYear()} Legend. All rights reserved.</p>
      </footer>
    </div>
  )
}
