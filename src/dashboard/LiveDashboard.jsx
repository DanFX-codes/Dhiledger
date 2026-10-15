import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, LogOut, Plus, Trash2 } from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle'
import { supabase } from '../lib/supabase'

const categoryOptions = ['Cloud infrastructure', 'Software subscriptions', 'Vendor services', 'Hardware', 'Other']
const currencyOptions = ['USD', 'NGN', 'GBP', 'EUR']
const today = () => new Date().toISOString().slice(0, 10)

function money(amount, currency) {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${currency} ${Number(amount).toLocaleString()}`
  }
}

function currencyTotals(entries) {
  const totals = entries.reduce((current, entry) => {
    current[entry.currency] = (current[entry.currency] || 0) + Number(entry.amount)
    return current
  }, {})
  return Object.entries(totals).sort(([left], [right]) => left.localeCompare(right))
}

function initials(user) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User'
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

export function LiveDashboard({ user }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [form, setForm] = useState({ vendor: '', category: categoryOptions[0], amount: '', currency: 'USD', transaction_date: today(), note: '' })
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    let active = true
    const loadEntries = async () => {
      const { data, error: queryError } = await supabase
        .from('ledger_entries')
        .select('id, vendor, category, amount, currency, transaction_date, note, created_at')
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (!active) return
      if (queryError) {
        setError(queryError.message)
      } else {
        setEntries(data || [])
        setError('')
      }
      setLoading(false)
    }

    loadEntries()
    const channel = supabase.channel(`ledger-entries-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ledger_entries',
        filter: `user_id=eq.${user.id}`,
      }, () => loadEntries())
      .subscribe((status) => setIsLive(status === 'SUBSCRIBED'))
    const refreshOnFocus = () => loadEntries()
    window.addEventListener('focus', refreshOnFocus)

    return () => {
      active = false
      window.removeEventListener('focus', refreshOnFocus)
      supabase.removeChannel(channel)
    }
  }, [user.id])

  const monthEntries = useMemo(() => entries.filter((entry) => entry.transaction_date?.startsWith(monthKey)), [entries, monthKey])
  const totals = useMemo(() => currencyTotals(monthEntries), [monthEntries])
  const vendorCount = useMemo(() => new Set(monthEntries.map((entry) => entry.vendor.trim().toLowerCase())).size, [monthEntries])
  const categoryCounts = useMemo(() => {
    const counts = monthEntries.reduce((current, entry) => {
      current[entry.category] = (current[entry.category] || 0) + 1
      return current
    }, {})
    return Object.entries(counts).sort(([, left], [, right]) => right - left)
  }, [monthEntries])
  const monthlyActivity = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const [year, month] = monthKey.split('-').map(Number)
    const date = new Date(year, month - 6 + index, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      label: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
      count: entries.filter((entry) => entry.transaction_date?.startsWith(key)).length,
    }
  }), [entries, monthKey])
  const maxActivity = Math.max(1, ...monthlyActivity.map((period) => period.count))

  const updateForm = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const addEntry = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormMessage('')
    setError('')
    const { data, error: insertError } = await supabase.from('ledger_entries').insert({
      vendor: form.vendor.trim(),
      category: form.category,
      amount: Number(form.amount),
      currency: form.currency,
      transaction_date: form.transaction_date,
      note: form.note.trim() || null,
    }).select('id, vendor, category, amount, currency, transaction_date, note, created_at').single()

    if (insertError) {
      setFormMessage(insertError.message)
    } else {
      setEntries((current) => [data, ...current.filter((entry) => entry.id !== data.id)].sort((left, right) => right.transaction_date.localeCompare(left.transaction_date)))
      setForm({ vendor: '', category: categoryOptions[0], amount: '', currency: 'USD', transaction_date: today(), note: '' })
      setFormMessage('Expense added to your workspace.')
    }
    setSaving(false)
  }

  const removeEntry = async (id) => {
    setRemovingId(id)
    setError('')
    const { error: deleteError } = await supabase.from('ledger_entries').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) setError(deleteError.message)
    else setEntries((current) => current.filter((entry) => entry.id !== id))
    setRemovingId('')
  }

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) setError(signOutError.message)
  }

  return <main className="live-workspace">
    <header className="workspace-header">
      <a className="wordmark" href="/" aria-label="Dhiledger home"><img className="brand-logo" src="/IMG-20261010-WA0008.jpg" alt="Dhiledger" /></a>
      <div className="workspace-account">
        <ThemeToggle />
        <span className="workspace-avatar" aria-hidden="true">{initials(user)}</span>
        <span className="workspace-email">{user.email}</span>
        <button className="workspace-icon-button" type="button" onClick={signOut} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
      </div>
    </header>

    <div className="workspace-content">
      <div className="workspace-title-row">
        <div><span className="eyebrow">Your workspace</span><h1>Spend overview</h1><p>Private expense records for {user.user_metadata?.full_name || user.email}.</p></div>
        <span className={`realtime-status ${isLive ? 'is-connected' : ''}`}><Activity size={15} />{isLive ? 'Live updates on' : 'Connecting to live updates'}</span>
      </div>

      <div className="workspace-disclaimer"><span>Manual records only</span><p>These figures come from expenses you add here. No bank, accounting, or vendor accounts are connected.</p></div>
      {error && <div className="workspace-error" role="alert"><strong>Could not sync your workspace.</strong><span>{error}</span><small>Check the Supabase setup and row-level security policies in the setup guide.</small></div>}

      <section className="workspace-metrics" aria-label="Monthly summary">
        <article className="workspace-metric"><span>This month · spend by currency</span><strong>{totals.length ? totals.map(([currency, amount]) => money(amount, currency)).join(' · ') : 'No spend recorded'}</strong><small>Entries dated this calendar month</small></article>
        <article className="workspace-metric"><span>Vendors this month</span><strong>{vendorCount}</strong><small>Unique vendor names</small></article>
        <article className="workspace-metric"><span>Records in workspace</span><strong>{entries.length}</strong><small>Visible only to your account</small></article>
      </section>

      <div className="workspace-grid">
        <div className="workspace-main-column">
          <section className="workspace-panel" aria-labelledby="activity-title">
            <div className="workspace-panel-heading"><div><span className="eyebrow">Record activity</span><h2 id="activity-title">Entries over six months</h2></div><span className="workspace-panel-note">Number of records</span></div>
            <div className="activity-chart" role="img" aria-label={monthlyActivity.map((period) => `${period.label}: ${period.count} records`).join(', ')}>
              {monthlyActivity.map((period) => <div className="activity-column" key={period.key}><strong>{period.count}</strong><span className="activity-track"><i style={{ height: `${Math.max(7, (period.count / maxActivity) * 100)}%` }} /></span><small>{period.label}</small></div>)}
            </div>
          </section>

          <section className="workspace-panel" aria-labelledby="entries-title">
            <div className="workspace-panel-heading"><div><span className="eyebrow">Your data</span><h2 id="entries-title">Recent expenses</h2></div><span className="workspace-panel-note">{isLive ? 'Realtime sync active' : 'Sync connecting'}</span></div>
            {loading ? <p className="workspace-empty" role="status">Loading your records…</p> : entries.length === 0 ? <div className="workspace-empty"><strong>No expenses yet</strong><p>Add a record to begin building your private spend overview.</p></div> : <div className="workspace-table-scroll"><table className="workspace-table"><thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{entries.slice(0, 12).map((entry) => <tr key={entry.id}><td>{new Date(`${entry.transaction_date}T00:00:00`).toLocaleDateString()}</td><td><strong>{entry.vendor}</strong>{entry.note && <small>{entry.note}</small>}</td><td>{entry.category}</td><td>{money(Number(entry.amount), entry.currency)}</td><td><button className="entry-remove" type="button" aria-label={`Remove ${entry.vendor} expense`} title="Remove expense" disabled={removingId === entry.id} onClick={() => removeEntry(entry.id)}><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}
          </section>
        </div>

        <aside className="workspace-panel add-entry-panel">
          <div className="workspace-panel-heading"><div><span className="eyebrow">Manual entry</span><h2>Add an expense</h2></div><Plus size={18} /></div>
          <form onSubmit={addEntry}>
            <label className="workspace-field">Vendor<input name="vendor" value={form.vendor} onChange={updateForm} maxLength="120" required placeholder="e.g. Cloud provider" /></label>
            <div className="workspace-field-row">
              <label className="workspace-field">Amount<input name="amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={updateForm} required /></label>
              <label className="workspace-field">Currency<select name="currency" value={form.currency} onChange={updateForm}>{currencyOptions.map((currency) => <option key={currency}>{currency}</option>)}</select></label>
            </div>
            <label className="workspace-field">Category<select name="category" value={form.category} onChange={updateForm}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label className="workspace-field">Date<input name="transaction_date" type="date" value={form.transaction_date} onChange={updateForm} required /></label>
            <label className="workspace-field">Note <span>Optional</span><input name="note" value={form.note} onChange={updateForm} maxLength="240" /></label>
            {formMessage && <p className={formMessage.startsWith('Expense added') ? 'workspace-success' : 'workspace-error'} role={formMessage.startsWith('Expense added') ? 'status' : 'alert'}>{formMessage}</p>}
            <button className="button button-primary workspace-submit" type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add expense'}<ArrowUpRight size={16} /></button>
          </form>
          <p className="workspace-form-note"><ArrowDownRight size={14} /> Records are saved to your account and synced across signed-in sessions.</p>
        </aside>
      </div>

      <footer className="workspace-footer">Your data is isolated with Supabase row-level security. This workspace is not financial advice.</footer>
    </div>
  </main>
}