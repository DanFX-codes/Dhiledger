import { MotionConfig, motion } from 'framer-motion'
import {
  ArrowRight, BarChart3, Check, ChevronDown, CircleHelp, Cloud, Database, FileText, Filter,
  GitBranch, Info, LayoutDashboard, LockKeyhole, Menu, MousePointer2, PieChart, Search,
  ShieldCheck, SlidersHorizontal, Sparkles, Table2, X, Zap, Send, AlertCircle, Download,
  MoreHorizontal, ArrowUpDown, Eye, ClipboardCheck, Layers3, Landmark, BriefcaseBusiness,
} from 'lucide-react'
import {
  BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate, useParams,
} from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import { company } from './config/company'
import { capabilities, capabilityMap } from './config/capabilities'
import { consent, faq, forms, legalPages, pricing, security } from './config/content'
import { env } from './config/env'
import { site } from './config/site'
import { demoPaths, mainNav, routeRegistry } from './routes'
import { AuthProvider } from './auth/AuthProvider'
import { AuthCallbackPage, LoginPage, ProtectedDashboard } from './dashboard/AuthPages'
import { formatCurrency, sampleData } from './demo/sampleData'
import { ThemeToggle } from './components/ThemeToggle'
import './styles.css'

const statusText = { available: 'Available', prototype: 'Prototype', planned: 'Planned', hidden: 'Hidden' }
const iconForCapability = { 'spend-visibility': BarChart3, 'vendor-analysis': Table2, duplicates: Layers3, unusual: Zap, recommendations: Sparkles, verification: ClipboardCheck, reporting: FileText, 'audit-records': Eye }

function StatusBadge({ status = 'planned' }) {
  return <span className={`status-badge status-${status}`}><span className="status-dot" aria-hidden="true" />{statusText[status] || 'Planned'}</span>
}

function DemoLabel({ children = 'Demo · Sample data' }) {
  return <span className="demo-label"><span aria-hidden="true">●</span>{children}</span>
}

function ButtonLink({ to, children, variant = 'primary', icon = true }) {
  return <Link className={`button button-${variant}`} to={to}>{children}{icon && <ArrowRight size={16} aria-hidden="true" />}</Link>
}

function Seo({ title, description, robots = 'index' }) {
  useEffect(() => {
    document.title = title === 'Dhiledger' ? title : `${title} | Dhiledger`
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
    document.querySelector('meta[name="robots"]')?.remove()
    if (robots === 'noindex') {
      const meta = document.createElement('meta')
      meta.name = 'robots'
      meta.content = 'noindex, nofollow'
      document.head.appendChild(meta)
    }
    if (env.siteUrl) {
      const canonical = `${env.siteUrl}${window.location.pathname}`
      let link = document.querySelector('link[rel="canonical"]')
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
      link.href = canonical
      const metaValues = { 'og:url': canonical, 'og:title': document.title, 'og:description': description, 'twitter:card': 'summary', 'twitter:title': document.title, 'twitter:description': description }
      Object.entries(metaValues).forEach(([property, content]) => {
        let meta = document.querySelector(`meta[property="${property}"]`)
        if (!meta) { meta = document.createElement('meta'); meta.setAttribute('property', property); document.head.appendChild(meta) }
        meta.content = content
      })
    }
  }, [title, description, robots])
  return null
}

function RouteEffects() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.setTimeout(() => document.querySelector('main h1')?.focus(), 0)
  }, [location.pathname])
  return null
}

function SkipLink() { return <a className="skip-link" href="#main-content">Skip to content</a> }

function Header() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const location = useLocation()
  useEffect(() => { setOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => { if (event.key === 'Escape') { setOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return <header className="site-header">
    <div className="container header-inner">
      <Link to="/" className="wordmark" aria-label="Dhiledger home"><img className="brand-logo" src="/IMG-20261010-WA0008.jpg" alt="Dhiledger" /></Link>
      <nav className="desktop-nav" aria-label="Main navigation">
        {mainNav.map((path) => <Link key={path} className={location.pathname === path ? 'active' : ''} to={path}>{routeRegistry.find((route) => route.path === path)?.title}</Link>)}
        {site.demo.status === 'prototype' && <Link className={location.pathname.startsWith('/demo') ? 'active' : ''} to="/demo">Demo</Link>}
      </nav>
      <ThemeToggle />
      <Link className="header-login" to="/login">Log in</Link>
      <ButtonLink to={site.primaryCta.path}>{site.primaryCta.label}</ButtonLink>
      <button ref={triggerRef} className="icon-button menu-trigger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((value) => !value)}><Menu size={22} /></button>
    </div>
    {open && <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Mobile navigation">
      <div className="mobile-menu-head"><span className="eyebrow">Navigate</span><button className="icon-button" aria-label="Close menu" onClick={() => { setOpen(false); triggerRef.current?.focus() }}><X size={22} /></button></div>
      <nav aria-label="Mobile navigation links">
        {[...mainNav, ...(site.demo.status === 'prototype' ? ['/demo'] : [])].map((path) => <Link key={path} to={path}>{routeRegistry.find((route) => route.path === path)?.title || 'Demo'}<ArrowRight size={17} /></Link>)}
        <Link to="/login">Log in<ArrowRight size={17} /></Link>
        <ButtonLink to={site.primaryCta.path}>{site.primaryCta.label}</ButtonLink>
      </nav>
    </div>}
  </header>
}

function Footer() {
  const year = new Date().getFullYear()
  return <footer className="site-footer"><div className="container footer-grid">
    <div className="footer-brand"><Link to="/" className="wordmark" aria-label="Dhiledger home"><img className="brand-logo" src="/IMG-20261010-WA0008.jpg" alt="Dhiledger" /></Link><p>{site.descriptor}</p><p className="footer-note">A product direction in early development. This site is not a live financial analysis service.</p></div>
    <div><h2>Explore</h2><div className="footer-links">{['/product', '/how-it-works', '/use-cases', '/pricing', '/security'].map((path) => <Link key={path} to={path}>{routeRegistry.find((route) => route.path === path)?.title}</Link>)}</div></div>
    <div><h2>Company</h2><div className="footer-links">{['/about', '/contact', '/request-access', '/faq', '/resources'].map((path) => <Link key={path} to={path}>{routeRegistry.find((route) => route.path === path)?.title}</Link>)}</div></div>
    <div><h2>Legal templates</h2><div className="footer-links"><Link to="/legal">All legal templates</Link>{legalPages.map((page) => <Link key={page.path} to={page.path}>{page.title}</Link>)}</div></div>
  </div><div className="container footer-bottom"><span>© {year} {company.legalName || 'Dhiledger'}</span><span>Information architecture for clearer decisions.</span></div></footer>
}

function PageShell({ children, title, description, robots = 'index', eyebrow, tone = '' }) {
  return <><Seo title={title} description={description} robots={robots} /><Header /><SkipLink /><main id="main-content" className={`page-shell ${tone}`} tabIndex="-1">{eyebrow && <div className="container page-eyebrow eyebrow">{eyebrow}</div>}{children}</main><Footer /></>
}

function SectionHeading({ eyebrow, title, body, align = '' }) {
  return <div className={`section-heading ${align}`}><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{body && <p>{body}</p>}</div>
}

function MiniTrend({ data = sampleData.trend }) {
  const max = Math.max(...data)
  return <div className="mini-chart" role="img" aria-label="Illustrative sample expenditure trend over eight periods"><div className="chart-grid"><span /><span /><span /><span /></div><div className="chart-bars">{data.map((value, index) => <div className="chart-bar-wrap" key={`${value}-${index}`}><div className="chart-bar" style={{ height: `${Math.max(12, (value / max) * 100)}%` }} title={formatCurrency(value)} /><span>{index + 1}</span></div>)}</div></div>
}

function PreviewDashboard() {
  const [period, setPeriod] = useState(sampleData.periods[0])
  const [sortAsc, setSortAsc] = useState(false)
  const vendors = useMemo(() => [...sampleData.vendors].sort((a, b) => sortAsc ? a.amount - b.amount : b.amount - a.amount), [sortAsc])
  return <div className="dashboard-preview panel-lift">
    <div className="preview-topline"><DemoLabel>Illustrative example · Sample data</DemoLabel><Link to="/demo" className="text-link">Open demo <ArrowRight size={15} /></Link></div>
    <div className="preview-header"><div><span className="eyebrow">Technology spend overview</span><h3>See the signal in the noise.</h3></div><label className="select-wrap"><span className="sr-only">Demo period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}>{sampleData.periods.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label></div>
    <div className="metric-grid"><div className="metric-card"><span>Total expenditure</span><strong>{formatCurrency(sampleData.totalExpenditure[period])}</strong><small>Illustrative figure for {period.toLowerCase()}</small></div><div className="metric-card"><span>Categories in view</span><strong>04</strong><small>Sample classification only</small></div><div className="metric-card"><span>Review signals</span><strong>03</strong><small>Not a live account</small></div></div>
    <div className="preview-grid"><div className="data-card"><div className="card-heading"><div><span className="eyebrow">Trend</span><h4>Expenditure by period</h4></div><DemoLabel /></div><MiniTrend /></div><div className="data-card"><div className="card-heading"><div><span className="eyebrow">Category mix</span><h4>Where it sits</h4></div><PieChart size={18} /></div><div className="category-list">{sampleData.categories.map((category) => <div className="category-row" key={category.label}><span><i className="category-dot" />{category.label}</span><strong>{category.share}%</strong></div>)}</div></div></div>
    <div className="data-card table-card"><div className="card-heading"><div><span className="eyebrow">Vendor expenditure</span><h4>Generic sample vendors</h4></div><button className="table-action" onClick={() => setSortAsc((value) => !value)}><ArrowUpDown size={15} /> Sort by amount</button></div><div className="table-scroll"><table><thead><tr><th>Vendor</th><th>Category</th><th><button className="th-button" onClick={() => setSortAsc((value) => !value)}>Amount <ArrowUpDown size={13} /></button></th><th>Change</th></tr></thead><tbody>{vendors.slice(0, 4).map((vendor) => <tr key={vendor.name}><td>{vendor.name}</td><td>{vendor.category}</td><td>{formatCurrency(vendor.amount)}</td><td className={vendor.change.startsWith('+') ? 'change-up' : 'change-down'}>{vendor.change}</td></tr>)}</tbody></table></div></div>
    <div className="preview-footer-note"><Info size={16} /><span>Sample data is read-only. Export and account connection are not available in this demo.</span></div>
  </div>
}

const problems = ['Scattered visibility into technology spending', 'Difficulty reviewing vendor expenditure', 'Unused or overlapping subscriptions', 'Unexplained changes in cloud or software costs', 'Recommendations that are hard to validate', 'Limited evidence of whether a cost-saving action worked']
const workflow = [
  ['Connect', 'Import the available data source or upload a supported CSV file.', 'Intended CSV-first MVP direction; upload is not available on this site.', Database],
  ['Analyze', 'Organize and inspect spending data.', 'The future product would help teams create a consistent view.', Search],
  ['Identify', 'Surface potential anomalies, duplication, unused services or unexpected expenditure.', 'Candidates still need context and review.', Zap],
  ['Recommend', 'Present opportunities with clear explanations and supporting evidence.', 'A recommendation is not a financial result.', Sparkles],
  ['Act', 'Authorized users evaluate and approve appropriate actions.', 'Any financial action remains with the customer.', ClipboardCheck],
  ['Verify', 'Compare relevant spending before and after an action to see whether the expected change occurred.', 'The comparison depends on period, pricing, usage and data quality.', Check],
]
const useCases = [
  ['Cloud infrastructure expenditure', 'Create a clearer view of cloud-related expenditure and investigate changes.', Cloud],
  ['SaaS subscriptions', 'Review subscription categories and possible overlapping or unused services.', Layers3],
  ['Vendor and supplier expenditure', 'Bring vendor expenditure into a reviewable context for finance and engineering.', BriefcaseBusiness],
  ['Finance and operations oversight', 'Support a shared language for technology-spend conversations.', Landmark],
  ['Startup cost visibility', 'Help growing teams understand where technology spend is accumulating.', PieChart],
  ['Technology-spend accountability', 'Keep attention on evidence, review and whether expected changes occurred.', ShieldCheck],
]

function Home() {
  return <PageShell title="Dhiledger" description="Financial intelligence for technology-driven companies.">
    <section className="hero"><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" />Financial intelligence for technology-driven companies</div><h1>{site.tagline}</h1><p className="hero-lede">Get a clearer view of your technology and vendor spending. Identify potential inefficiencies, investigate unusual costs, and measure whether savings opportunities deliver real results.</p><div className="hero-actions"><ButtonLink to="/request-access">Request early access</ButtonLink><ButtonLink to="/how-it-works" variant="secondary">See how it works</ButtonLink></div><p className="hero-footnote"><LockKeyhole size={15} />No account access, uploads or live analysis on this website.</p></div><div className="hero-visual"><PreviewDashboard /></div></div></section>
    <section className="section section-soft"><div className="container"><SectionHeading eyebrow="The review gap" title="Technology spend deserves more than a monthly total." body="Dhiledger is designed around the moments where teams need to move from fragmented information to an investigated, explainable decision." /><div className="problem-grid">{problems.map((problem, index) => <div className="problem-item" key={problem}><span>0{index + 1}</span><p>{problem}</p></div>)}</div></div></section>
    <section className="section"><div className="container"><SectionHeading eyebrow="The intended product direction" title="From fragmented spend to evidence you can review." body="The future Dhiledger product is being shaped for finance and engineering teams that need a clearer view of technology, cloud, software, subscription and vendor spending." /><div className="capability-grid">{capabilities.filter((item) => item.status !== 'hidden').map((item) => <CapabilityCard key={item.id} capability={item} />)}</div></div></section>
    <WorkflowSection />
    <section className="section section-dark"><div className="container verification-layout"><div><span className="eyebrow eyebrow-light">Savings verification</span><h2>A recommendation is not a result.</h2><p>The intended workflow helps a team evaluate an opportunity, record an appropriate action, and compare relevant expenditure to see whether the expected change occurred. The comparison depends on data quality, time periods, pricing changes and usage.</p><ButtonLink to="/demo/savings" variant="light">See the illustrative flow</ButtonLink></div><VerificationDiagram /></div></section>
    <section className="section"><div className="container"><SectionHeading eyebrow="Where it may help" title="A clearer lens for technology-driven teams." body="These are problem areas Dhiledger is being designed to address. They are separate from implemented functionality or supported integrations on this website." /><UseCaseGrid /></div></section>
    <SecuritySection />
    <FaqSection compact />
    <FinalCta />
  </PageShell>
}

function CapabilityCard({ capability }) {
  const Icon = iconForCapability[capability.id] || Sparkles
  return <div className="capability-card"><div className="icon-tile"><Icon size={19} /></div><div><div className="card-title-row"><h3>{capability.title}</h3><StatusBadge status={capability.status} /></div><p>{capability.description}</p></div></div>
}

function WorkflowSection() {
  return <section className="section section-soft"><div className="container"><SectionHeading eyebrow="How it is intended to work" title="Six stages from source data to a reviewed outcome." body="CSV-first import is the intended MVP direction. Connections to cloud providers, SaaS platforms, accounting tools, billing and procurement systems are planned, not available here." /><div className="workflow-list">{workflow.map(([title, text, note, Icon], index) => <div className="workflow-step" key={title}><div className="workflow-index">0{index + 1}</div><div className="workflow-icon"><Icon size={20} /></div><div><h3>{title}</h3><p>{text}</p><small>{note}</small></div>{index < workflow.length - 1 && <div className="workflow-connector" aria-hidden="true" />}</div>)}</div><div className="planned-strip"><span><Cloud size={17} />External integrations</span><StatusBadge status="planned" /><span className="planned-strip-copy">Coming soon · no connect controls are provided</span></div></div></section>
}

function VerificationDiagram() { return <div className="verification-diagram" aria-label="Illustrative savings verification flow"><DemoLabel>Illustrative example</DemoLabel><div className="verify-row"><div><span>Before</span><strong>Relevant period</strong><small>Data quality and usage reviewed</small></div><ArrowRight size={18} /><div><span>Action</span><strong>Reviewed change</strong><small>Customer decides what to do</small></div><ArrowRight size={18} /><div><span>After</span><strong>Comparable period</strong><small>Expected change assessed</small></div></div><p><Info size={15} />No outcome is implied by this illustration.</p></div> }
function UseCaseGrid() { return <div className="use-case-grid">{useCases.map(([title, text, Icon]) => <div className="use-case-card" key={title}><Icon size={20} /><h3>{title}</h3><p>{text}</p><span>Planned direction</span></div>)}</div> }
function SecuritySection() { return <section className="section section-soft"><div className="container security-layout"><div><SectionHeading eyebrow="Security & data stewardship" title="Responsible handling should be designed in from the start." body="Dhiledger is early in development. The statements below describe design intent, not verified controls or certifications." /><ButtonLink to="/security" variant="secondary">Read the security overview</ButtonLink></div><div className="security-list">{security.statements.slice(0, 4).map((item) => <div className="security-item" key={item.title}><ShieldCheck size={19} /><div><h3>{item.title}</h3><p>{item.statement}</p><StatusBadge status={item.verified && item.evidenceNote ? 'available' : 'planned'} /></div></div>)}</div></div></section> }
function FaqSection({ compact = false }) { const items = compact ? faq.slice(0, 5) : faq; return <section className="section"><div className="container faq-layout"><SectionHeading eyebrow="Questions, answered plainly" title="What we can say today." body="Unconfirmed policy and infrastructure details are intentionally omitted." /> <Accordion items={items} /></div></section> }
function Accordion({ items }) { const [open, setOpen] = useState(0); return <div className="accordion">{items.map((item, index) => <div className={`accordion-item ${open === index ? 'is-open' : ''}`} key={item.question}><button aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}><span>{item.question}</span><ChevronDown size={18} /></button>{open === index && <div className="accordion-answer"><p>{item.answer}</p></div>}</div>)}</div> }
function FinalCta() { return <section className="final-cta"><div className="container final-cta-inner"><div><span className="eyebrow eyebrow-light">Keep the conversation evidence-led</span><h2>{site.tagline}</h2></div><ButtonLink to="/request-access" variant="light">Request early access</ButtonLink></div></section> }

function StandardPage({ eyebrow, title, intro, children, tone = '' }) { return <PageShell title={title} description={intro} eyebrow={eyebrow} tone={tone}><div className="container narrow-page"><h1 tabIndex="-1">{title}</h1><p className="page-intro">{intro}</p>{children}</div></PageShell> }
function ProductPage() { return <StandardPage eyebrow="Product direction" title="A reviewable view of technology spend." intro="Dhiledger is being designed to help teams investigate technology, cloud, software, subscription and vendor expenditure with more context. The interface below describes the intended direction; it is not a live product."><div className="feature-stack">{capabilities.map((capability) => <CapabilityCard key={capability.id} capability={capability} />)}</div><div className="inline-callout"><DemoLabel />Explore the read-only sample interface to see how the direction could be organized.<ButtonLink to="/demo" variant="secondary">Open the demo</ButtonLink></div></StandardPage> }
function HowItWorksPage() { return <StandardPage eyebrow="Workflow" title="A six-stage path to a reviewed outcome." intro="The intended workflow starts with available financial and expenditure data, moves through investigation, and keeps human review at the center."><div className="workflow-list workflow-deep">{workflow.map(([title, text, note, Icon], index) => <div className="workflow-step" key={title}><div className="workflow-index">0{index + 1}</div><div className="workflow-icon"><Icon size={20} /></div><div><h2>{title}</h2><p>{text}</p><small>{note}</small></div></div>)}</div><div className="planned-panel"><StatusBadge status="planned" /><h2>CSV-first is an intended MVP direction.</h2><p>File upload and import are not available on this website. Connections to cloud providers, SaaS platforms, accounting tools, billing and procurement systems are planned separately.</p></div></StandardPage> }
function UseCasesPage() { return <StandardPage eyebrow="Use cases" title="Designed for teams that need a clearer spend conversation." intro="Dhiledger’s customer hypothesis includes technology startups and scale-ups, SaaS, software and AI companies, and teams with significant cloud or vendor spend. This is a direction, not an eligibility rule."><UseCaseGrid /><div className="prose-note"><Info size={18} /><p>Each use case remains separate from implemented functionality or supported integrations. The website does not connect to accounts or analyze submitted financial data.</p></div></StandardPage> }
function PricingPage() { return <StandardPage eyebrow="Pricing" title="Pricing not yet published." intro="Dhiledger pricing has not been approved for publication. Request early access to share the context you are solving for."><div className="empty-state large"><div className="empty-icon"><SlidersHorizontal size={23} /></div><h2>No published plans yet.</h2><p>There are no prices, tiers, discounts or trial claims on this website.</p><ButtonLink to="/request-access">Request early access</ButtonLink></div></StandardPage> }
function SecurityPage() { return <StandardPage eyebrow="Security overview" title="Transparent about what is planned." intro="The statements below are design intent unless Dhiledger supplies evidence and confirms them. This page does not claim certification or verified compliance."><div className="security-page-list">{security.statements.map((item) => <div className="security-page-item" key={item.title}><div className="icon-tile"><ShieldCheck size={20} /></div><div><div className="card-title-row"><h2>{item.title}</h2><StatusBadge status={item.verified && item.evidenceNote ? 'available' : 'planned'} /></div><p>{item.verified && item.evidenceNote ? item.statement : `Planned approach: ${item.statement}`}</p>{item.verified && item.evidenceNote && <small>{item.evidenceNote}</small>}</div></div>)}</div></StandardPage> }
function AboutPage() { return <StandardPage eyebrow="About Dhiledger" title="Make technology spend easier to understand." intro="Dhiledger is a fintech infrastructure and financial intelligence concept founded in Nigeria and shaped for internationally usable B2B teams. It is in pre-MVP development."><div className="about-story"><div><span className="eyebrow">Mission</span><h2>Give finance and engineering teams a shared view of the money moving through technology.</h2></div><div><p>Dhiledger is designed to help teams identify possible inefficiencies, investigate unusual costs, find duplicate or unused services, evaluate savings opportunities and verify whether recommended savings actually materialized.</p><p>The product vision is practical: make the evidence easier to review without implying that a recommendation is an outcome.</p></div></div></StandardPage> }
function ResourcesPage() { return <StandardPage eyebrow="Resources" title="Resources will appear here when they are real." intro="No public resources, papers, reports or downloads have been supplied yet."><div className="empty-state large"><div className="empty-icon"><FileText size={23} /></div><h2>Nothing published.</h2><p>This page intentionally stays empty until real Dhiledger resources are ready.</p></div></StandardPage> }

function Field({ label, name, type = 'text', value, onChange, error, required = false, autoComplete, children, maxLength }) { const id = `field-${name}`; return <div className="field"><label htmlFor={id}>{label} {required && <span className="required">(required)</span>}</label>{children || <input id={id} name={name} type={type} value={value} onChange={onChange} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} maxLength={maxLength} />}{error && <span className="field-error" id={`${id}-error`}><AlertCircle size={14} />{error}</span>}</div> }
function useFormSubmit(formId) { const [state, setState] = useState(() => env.formEndpoint ? { status: 'idle', message: '' } : { status: 'disabled', message: 'This form is not accepting submissions yet.' }); const submit = async (payload, honeypot) => { if (honeypot) { setState({ status: 'error', message: 'We could not send this form. Please try again.' }); return false } if (!env.formEndpoint) { setState({ status: 'disabled', message: 'This form is not accepting submissions yet.' }); return false } setState({ status: 'sending', message: 'Sending…' }); const controller = new AbortController(); const timeout = window.setTimeout(() => controller.abort(), 10000); try { const response = await fetch(env.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ form: formId, ...payload }), signal: controller.signal }); if (!response.ok) throw new Error('Request failed'); setState({ status: 'success', message: 'Thanks — your request was sent.' }); return true } catch { setState({ status: 'error', message: 'We could not send this form. Please try again.' }); return false } finally { window.clearTimeout(timeout) } }; return { state, submit } }
function validate(values, fields) { const errors = {}; fields.forEach(([name, label, required]) => { if (required && !values[name]?.trim()) errors[name] = `${label} is required.` }); if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) errors.email = 'Enter a valid email address.'; if (values.message && values.message.length > forms.maxMessageLength) errors.message = `Keep the message under ${forms.maxMessageLength} characters.`; return errors }
function FormAlert({ state }) { if (!state.message) return null; return <div className={`form-alert alert-${state.status}`} role={state.status === 'sending' ? 'status' : 'alert'}><Info size={16} /><span>{state.message}</span></div> }
function RequestAccessForm() { const initial = { name: '', email: '', company: '', role: '', spend: '', interest: '', message: '', website: '' }; const [values, setValues] = useState(initial); const [errors, setErrors] = useState({}); const { state, submit } = useFormSubmit('request-access'); const summaryRef = useRef(null); const required = [['name', 'Name', true], ['email', 'Work email', true], ['company', 'Company', true], ['role', 'Role', true], ['interest', 'Primary area of interest', true]]; const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value })); const onSubmit = async (event) => { event.preventDefault(); const nextErrors = validate(values, required); setErrors(nextErrors); if (Object.keys(nextErrors).length) { window.setTimeout(() => summaryRef.current?.focus(), 0); return } await submit({ name: values.name, email: values.email, company: values.company, role: values.role, spend: values.spend, interest: values.interest, message: values.message }, values.website) }; return <FormFrame title="Request early access" intro="Share a little context about what you are trying to understand. There is no eligibility test, and the optional spend range can be skipped." formId="request-access"><form onSubmit={onSubmit} noValidate><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex="-1" autoComplete="off" value={values.website} onChange={update} /></div>{Object.keys(errors).length > 0 && <div ref={summaryRef} tabIndex="-1" className="error-summary" role="alert"><strong>Check the highlighted fields.</strong><span>{Object.keys(errors).length} item(s) need attention.</span></div>}<div className="form-grid"><Field label="Name" name="name" value={values.name} onChange={update} error={errors.name} required autoComplete="name" /><Field label="Work email" name="email" type="email" value={values.email} onChange={update} error={errors.email} required autoComplete="email" /><Field label="Company" name="company" value={values.company} onChange={update} error={errors.company} required autoComplete="organization" /><Field label="Role" name="role" value={values.role} onChange={update} error={errors.role} required autoComplete="organization-title" /></div><Field label="Approximate monthly technology spend" name="spend" value={values.spend} onChange={update}><select id="field-spend" name="spend" value={values.spend} onChange={update}><option value="">Optional — select a range</option>{forms.spendRanges.map((range) => <option key={range}>{range}</option>)}</select></Field><Field label="Primary area of interest" name="interest" value={values.interest} onChange={update} error={errors.interest} required><select id="field-interest" name="interest" value={values.interest} onChange={update} aria-invalid={Boolean(errors.interest)} aria-describedby={errors.interest ? 'field-interest-error' : undefined}><option value="">Select an area</option>{forms.interests.map((interest) => <option key={interest}>{interest}</option>)}</select>{errors.interest && <span className="field-error" id="field-interest-error"><AlertCircle size={14} />{errors.interest}</span>}</Field><Field label="Message" name="message" value={values.message} onChange={update} maxLength={forms.maxMessageLength}><textarea id="field-message" name="message" value={values.message} onChange={update} rows="5" maxLength={forms.maxMessageLength} aria-describedby={errors.message ? 'field-message-error' : undefined} />{errors.message && <span className="field-error" id="field-message-error"><AlertCircle size={14} />{errors.message}</span>}</Field><p className="form-helper">Please don’t include financial account details or sensitive files in this form.</p><FormAlert state={state} /><button className="button button-primary form-submit" type="submit" disabled={state.status === 'sending' || state.status === 'disabled'} aria-disabled={state.status === 'sending' || state.status === 'disabled'}>{state.status === 'sending' ? 'Sending…' : 'Send request'}<Send size={16} /></button></form></FormFrame> }
function ContactForm() { const initial = { name: '', email: '', subject: '', message: '', website: '' }; const [values, setValues] = useState(initial); const [errors, setErrors] = useState({}); const { state, submit } = useFormSubmit('contact'); const summaryRef = useRef(null); const required = [['name', 'Name', true], ['email', 'Email', true], ['subject', 'Subject', true], ['message', 'Message', true]]; const update = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value })); const onSubmit = async (event) => { event.preventDefault(); const nextErrors = validate(values, required); setErrors(nextErrors); if (Object.keys(nextErrors).length) { window.setTimeout(() => summaryRef.current?.focus(), 0); return } await submit({ name: values.name, email: values.email, subject: values.subject, message: values.message }, values.website) }; return <FormFrame title="Contact Dhiledger" intro="Use this form for general questions. Please do not include financial account details or sensitive files." formId="contact"><form onSubmit={onSubmit} noValidate><div className="honeypot" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" name="website" tabIndex="-1" autoComplete="off" value={values.website} onChange={update} /></div>{Object.keys(errors).length > 0 && <div ref={summaryRef} tabIndex="-1" className="error-summary" role="alert"><strong>Check the highlighted fields.</strong><span>{Object.keys(errors).length} item(s) need attention.</span></div>}<Field label="Name" name="name" value={values.name} onChange={update} error={errors.name} required autoComplete="name" /><Field label="Email" name="email" type="email" value={values.email} onChange={update} error={errors.email} required autoComplete="email" /><Field label="Subject" name="subject" value={values.subject} onChange={update} error={errors.subject} required /><Field label="Message" name="message" value={values.message} onChange={update} error={errors.message} required maxLength={forms.maxMessageLength}><textarea id="field-message" name="message" value={values.message} onChange={update} rows="7" maxLength={forms.maxMessageLength} aria-invalid={Boolean(errors.message)} aria-describedby={errors.message ? 'field-message-error' : undefined} /></Field><p className="form-helper">Please don’t include financial account details or sensitive files in this form.</p><FormAlert state={state} /><button className="button button-primary form-submit" type="submit" disabled={state.status === 'sending' || state.status === 'disabled'} aria-disabled={state.status === 'sending' || state.status === 'disabled'}>{state.status === 'sending' ? 'Sending…' : 'Send message'}<Send size={16} /></button></form></FormFrame> }
function FormFrame({ title, intro, children }) { return <PageShell title={title} description={intro}><div className="container form-page"><div className="form-intro"><span className="eyebrow">Dhiledger</span><h1 tabIndex="-1">{title}</h1><p>{intro}</p></div><div className="form-card">{children}</div></div></PageShell> }
function ContactPage() { return <ContactForm /> }
function RequestAccessPage() { return <RequestAccessForm /> }

function DemoShell({ children, pageTitle }) { const location = useLocation(); const demoNav = [['/demo', 'Overview', LayoutDashboard], ['/demo/spending', 'Spending', BarChart3], ['/demo/vendors', 'Vendors', Table2], ['/demo/insights', 'Insights', Zap], ['/demo/recommendations', 'Recommendations', Sparkles], ['/demo/savings', 'Savings', Check], ['/demo/reports', 'Reports', FileText], ['/demo/audit-log', 'Audit log', ClipboardCheck]]; return <PageShell title={pageTitle} description="Read-only sample-data demonstration." robots="noindex" tone="demo-tone"><div className="demo-app"><div className="demo-banner"><div><DemoLabel>Demo · Sample data, not a live account</DemoLabel><span>Read-only interface · fictional figures · resets on reload</span></div><Link to="/request-access" className="text-link">Request early access <ArrowRight size={15} /></Link></div><div className="demo-layout"><aside className="demo-sidebar"><Link to="/demo" className="demo-logo"><img className="brand-logo" src="/IMG-20261010-WA0008.jpg" alt="Dhiledger" /><small>Prototype</small></Link><nav aria-label="Demo navigation">{demoNav.map(([path, label, Icon]) => <Link key={path} to={path} className={location.pathname === path ? 'active' : ''}><Icon size={17} />{label}</Link>)}</nav><div className="demo-sidebar-foot"><Link to="/"><ArrowRight size={15} />Back to website</Link><span>Sample data only</span></div></aside><div className="demo-content"><div className="demo-content-head"><div><span className="eyebrow">Sample workspace</span><h1 tabIndex="-1">{pageTitle}</h1></div><div className="demo-user"><span>SR</span><small>Sample reviewer</small></div></div>{children}</div></div></div></PageShell> }
function DemoOverview() { return <DemoShell pageTitle="Spend overview"><div className="demo-grid demo-metrics"><DemoMetric label="Total expenditure" value={formatCurrency(sampleData.totalExpenditure['Last 30 days'])} note="Illustrative sample period" /><DemoMetric label="Categories in view" value="04" note="Fictional classification" /><DemoMetric label="Review signals" value="03" note="Candidates for investigation" /></div><div className="demo-grid two"><DemoPanel title="Expenditure trend"><DemoLabel /><MiniTrend /></DemoPanel><DemoPanel title="Spend by category"><DemoLabel /><div className="category-list big">{sampleData.categories.map((category) => <div className="category-row" key={category.label}><span><i className="category-dot" />{category.label}</span><strong>{formatCurrency(category.value)}</strong></div>)}</div></DemoPanel></div><div className="demo-grid two"><DemoPanel title="Potentially unusual expenditure"><InsightList items={sampleData.insights.slice(0, 2)} /></DemoPanel><DemoPanel title="Reviewable opportunities"><OpportunityList /></DemoPanel></div></DemoShell> }
function DemoMetric({ label, value, note }) { return <div className="demo-panel demo-metric"><span>{label}</span><strong>{value}</strong><small>{note}</small></div> }
function DemoPanel({ title, children, actions }) { return <section className="demo-panel"><div className="demo-panel-head"><div><span className="eyebrow">{title}</span></div>{actions || <DemoLabel />}</div>{children}</section> }
function InsightList({ items }) { return <div className="insight-list">{items.map((item) => <div className="insight-row" key={item.title}><span className={`insight-icon tone-${item.tone}`}><Zap size={15} /></span><div><strong>{item.title}</strong><p>{item.detail}</p></div><StatusBadge status="prototype" /></div>)}</div> }
function OpportunityList() { return <div className="opportunity-list">{sampleData.opportunities.slice(0, 3).map((item) => <div className="opportunity-row" key={item.title}><div><strong>{item.title}</strong><small>{item.owner}</small></div><span className={`opportunity-status state-${item.state.toLowerCase().replaceAll(' ', '-')}`}>{item.state}</span></div>)}</div> }
function DemoSpending() { const [period, setPeriod] = useState(sampleData.periods[0]); return <DemoShell pageTitle="Spending"><div className="demo-toolbar"><label className="select-wrap"><span>Period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}>{sampleData.periods.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></label><button className="secondary-control"><Filter size={15} /> Sample filter</button></div><div className="demo-grid two"><DemoPanel title={`Expenditure · ${period}`}><DemoLabel /><div className="demo-big-number">{formatCurrency(sampleData.totalExpenditure[period])}</div><MiniTrend /></DemoPanel><DemoPanel title="Category mix"><DemoLabel /><div className="category-list big">{sampleData.categories.map((category) => <div className="category-row" key={category.label}><span><i className="category-dot" />{category.label}</span><strong>{category.share}%</strong></div>)}</div></DemoPanel></div></DemoShell> }
function DemoVendors() { const [sortAsc, setSortAsc] = useState(false); const vendors = [...sampleData.vendors].sort((a, b) => sortAsc ? a.amount - b.amount : b.amount - a.amount); return <DemoShell pageTitle="Vendors"><DemoPanel title="Vendor expenditure" actions={<button className="secondary-control" onClick={() => setSortAsc((value) => !value)}><ArrowUpDown size={15} /> Sort amount</button>}><DemoLabel /><div className="table-scroll"><table><thead><tr><th>Vendor</th><th>Category</th><th>Amount</th><th>Change</th><th>State</th></tr></thead><tbody>{vendors.map((vendor) => <tr key={vendor.name}><td><strong>{vendor.name}</strong></td><td>{vendor.category}</td><td>{formatCurrency(vendor.amount)}</td><td>{vendor.change}</td><td><StatusBadge status="prototype" /></td></tr>)}</tbody></table></div><p className="panel-footnote"><Info size={15} />Generic fictional vendor names. No vendor accounts are connected.</p></DemoPanel></DemoShell> }
function DemoInsights() { return <DemoShell pageTitle="Insights"><div className="demo-grid two"><DemoPanel title="Signals for investigation"><InsightList items={sampleData.insights} /></DemoPanel><DemoPanel title="What the signal means"><DemoLabel /><div className="empty-state"><div className="empty-icon"><Search size={21} /></div><h2>Context still matters.</h2><p>These sample signals are not findings about a real account. A future workflow would require the team to review data quality, usage and the relevant period.</p></div></DemoPanel></div></DemoShell> }
function DemoRecommendations() { return <DemoShell pageTitle="Recommendations"><DemoPanel title="Reviewable opportunities"><DemoLabel /><OpportunityList /><p className="panel-footnote"><Info size={15} />Statuses are illustrative labels only. They cannot be changed in the demo.</p></DemoPanel></DemoShell> }
function DemoSavings() { return <DemoShell pageTitle="Savings verification"><DemoPanel title="Illustrative comparison"><DemoLabel>Illustrative example</DemoLabel><div className="demo-verify"><div><span>Before</span><strong>Relevant period</strong><small>Usage and pricing reviewed</small></div><ArrowRight size={18} /><div><span>Action</span><strong>Reviewed change</strong><small>Customer decides what to do</small></div><ArrowRight size={18} /><div><span>After</span><strong>Comparable period</strong><small>Expected change assessed</small></div></div><div className="assumption-list"><strong>Assumptions to document</strong><span>Data period and data quality</span><span>Pricing changes</span><span>Usage changes</span></div><p className="panel-footnote"><Info size={15} />This view does not calculate or confirm a savings result.</p></DemoPanel><DemoPanel title="Sample state labels"><div className="state-grid">{sampleData.opportunities.map((item) => <div className="state-card" key={item.state}><span className={`state-icon state-${item.state.toLowerCase().replaceAll(' ', '-')}`}><Check size={16} /></span><strong>{item.state}</strong><small>{item.title}</small></div>)}</div></DemoPanel></DemoShell> }
function DemoReports() { return <DemoShell pageTitle="Reports"><DemoPanel title="Sample report index"><DemoLabel /><div className="report-list">{sampleData.reports.map((report) => <div className="report-row" key={report}><FileText size={18} /><div><strong>{report}</strong><small>Illustrative sample entry</small></div><button className="disabled-button" disabled aria-disabled="true"><Download size={15} />Export unavailable</button></div>)}</div><p className="panel-footnote"><Info size={15} />No file is generated or downloaded by this demo.</p></DemoPanel></DemoShell> }
function DemoAudit() { return <DemoShell pageTitle="Audit log"><DemoPanel title="Sample activity"><DemoLabel /><div className="audit-list">{sampleData.audit.map((entry) => <div className="audit-row" key={entry.time + entry.action}><span>{entry.time}</span><div><strong>{entry.action}</strong><small>{entry.actor} · sample entry</small></div><MoreHorizontal size={18} /></div>)}</div></DemoPanel></DemoShell> }
function DemoSettings({ section }) { return <DemoShell pageTitle={`Settings · ${section}`}><DemoPanel title="Layout preview"><DemoLabel /><div className="settings-preview"><div className="settings-row"><span>Profile and organization details</span><button className="disabled-button" disabled aria-disabled="true">Editing unavailable</button></div><div className="settings-row"><span>Retention and deletion preferences</span><button className="disabled-button" disabled aria-disabled="true">Editing unavailable</button></div><div className="settings-row"><span>Privacy controls</span><button className="disabled-button" disabled aria-disabled="true">Editing unavailable</button></div></div><p className="panel-footnote"><Info size={15} />Settings are shown as layout only. No account, storage or control workflow exists here.</p></DemoPanel></DemoShell> }

function ProductNotAvailable() { return <StandardPage eyebrow="Not available" title="The live Dhiledger product is not available yet." intro="This website contains a read-only sample-data demonstration, not a live account or financial analysis service."><div className="not-available-actions"><ButtonLink to="/demo">Explore the demo</ButtonLink><ButtonLink to="/request-access" variant="secondary">Request early access</ButtonLink></div></StandardPage> }
function LegalIndex() { return <StandardPage eyebrow="Legal templates" title="Legal templates" intro="The Dhiledger team will supply and approve legal content before any policy is published."><div className="legal-index-list">{legalPages.map((page) => <Link key={page.path} to={page.path}><span>{page.title}</span><ArrowRight size={16} /></Link>)}</div></StandardPage> }
function LegalPage() { const { slug } = useParams(); const page = legalPages.find((item) => item.slug === slug); if (!page) return <NotFound />; return <PageShell title={page.title} description={page.title} robots="noindex"><div className="container legal-page"><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/legal">Legal</Link><span>/</span><span>{page.title}</span></div><h1 tabIndex="-1">{page.title}</h1><section data-testid="legal-content" className="legal-content" /></div></PageShell> }
function NotFound() { return <StandardPage eyebrow="404" title="Page not found" intro="That address does not match a Dhiledger page."><div className="not-available-actions"><ButtonLink to="/">Go to homepage</ButtonLink><ButtonLink to="/product" variant="secondary">Explore the product</ButtonLink></div></StandardPage> }

function ConsentProvider({ children }) { if (!consent.enabled) return children; return children }
function AppRoutes() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/product" element={<ProductPage />} />
    <Route path="/how-it-works" element={<HowItWorksPage />} />
    <Route path="/use-cases" element={<UseCasesPage />} />
    <Route path="/pricing" element={<PricingPage />} />
    <Route path="/security" element={<SecurityPage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
    <Route path="/request-access" element={<RequestAccessPage />} />
    <Route path="/faq" element={<StandardPage eyebrow="FAQ" title="Frequently asked questions" intro="Answers about what Dhiledger is, who it is for and what is planned."><Accordion items={faq} /></StandardPage>} />
    <Route path="/resources" element={<ResourcesPage />} />
    <Route path="/login" element={<><Seo title="Sign in" description="Sign in to your Dhiledger workspace." robots="noindex" /><LoginPage /></>} />
    <Route path="/auth/callback" element={<><Seo title="Signing in" description="Completing Google sign-in." robots="noindex" /><AuthCallbackPage /></>} />
    <Route path="/demo" element={<DemoOverview />} />
    <Route path="/demo/spending" element={<DemoSpending />} />
    <Route path="/demo/vendors" element={<DemoVendors />} />
    <Route path="/demo/insights" element={<DemoInsights />} />
    <Route path="/demo/recommendations" element={<DemoRecommendations />} />
    <Route path="/demo/savings" element={<DemoSavings />} />
    <Route path="/demo/reports" element={<DemoReports />} />
    <Route path="/demo/audit-log" element={<DemoAudit />} />
    <Route path="/demo/settings/profile" element={<DemoSettings section="Profile" />} />
    <Route path="/demo/settings/organization" element={<DemoSettings section="Organization" />} />
    <Route path="/demo/settings/data" element={<DemoSettings section="Data" />} />
    <Route path="/demo/settings/privacy" element={<DemoSettings section="Privacy" />} />
    <Route path="/dashboard/*" element={<><Seo title="Workspace dashboard" description="Your private Dhiledger workspace." robots="noindex" /><ProtectedDashboard /></>} />
    <Route path="/settings/*" element={<ProductNotAvailable />} />
    <Route path="/legal" element={<LegalIndex />} />
    <Route path="/legal/:slug" element={<LegalPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
}

function App() {
  return <MotionConfig reducedMotion="user"><BrowserRouter><AuthProvider><RouteEffects /><ConsentProvider><AppRoutes /></ConsentProvider></AuthProvider></BrowserRouter></MotionConfig>
}

export default App
