import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, FileText, LogOut, Plus, Trash2, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '../components/ThemeToggle'
import { supabase } from '../lib/supabase'
import { parseLedgerCsv } from './ledgerCsv'

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

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function currencyTotals(entries) {
  const totals = entries.reduce((current, entry) => {
    current[entry.currency] = (current[entry.currency] || 0) + Number(entry.amount)
    return current
  }, {})
  return Object.entries(totals).sort(([left], [right]) => left.localeCompare(right))
}

function ledgerSetupMessage(message) {
  if (!message) return message
  return message.includes('ledger_entries') && message.includes('schema cache')
    ? 'The ledger table is missing. Run the SQL in supabase/schema.sql inside your Supabase SQL editor, then reload the dashboard.'
    : message
}

function initials(user) {
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'User'
  return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function readCsvFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error || new Error('The CSV file could not be read.'))
    reader.readAsText(file)
  })
}

export function LiveDashboard({ user }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingId, setRemovingId] = useState('')
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState('')
  const [formMessage, setFormMessage] = useState('')
  const [csvFileName, setCsvFileName] = useState('')
  const [csvRows, setCsvRows] = useState([])
  const [csvError, setCsvError] = useState('')
  const [csvMessage, setCsvMessage] = useState('')
  const [importing, setImporting] = useState(false)
  const [selectedMonthKey, setSelectedMonthKey] = useState('')
  const [form, setForm] = useState({ vendor: '', category: categoryOptions[0], amount: '', currency: 'USD', transaction_date: today(), note: '' })
  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

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
        setError(ledgerSetupMessage(queryError.message))
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

  const entryMonthKeys = useMemo(() => [...new Set(entries.map((entry) => entry.transaction_date?.slice(0, 7)).filter(Boolean))].sort(), [entries])
  const monthKey = selectedMonthKey || entryMonthKeys.at(-1) || currentMonthKey
  const reportMonthOptions = useMemo(() => [...new Set([...entryMonthKeys, currentMonthKey, monthKey])].sort().reverse(), [entryMonthKeys, currentMonthKey, monthKey])
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

  const selectCsvFile = async (event) => {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    setCsvFileName(file.name)
    setCsvRows([])
    setCsvError('')
    setCsvMessage('')
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError('Choose a CSV file.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setCsvError('The CSV file must be 5 MB or smaller.')
      return
    }

    try {
      const rows = parseLedgerCsv(await readCsvFile(file))
      if (rows.length > 1000) throw new Error('A CSV file can contain up to 1,000 expenses at a time.')
      setCsvRows(rows)
      setCsvMessage(`${rows.length} ${rows.length === 1 ? 'expense' : 'expenses'} ready to review.`)
    } catch (fileError) {
      setCsvError(fileError.message || 'The CSV file could not be read.')
    }
  }

  const importCsv = async () => {
    if (!csvRows.length) return
    setImporting(true)
    setCsvError('')
    setCsvMessage('')
    try {
      const { data, error: importError } = await supabase.from('ledger_entries').insert(csvRows)
        .select('id, vendor, category, amount, currency, transaction_date, note, created_at')
      if (importError) throw importError

      const importedRows = data || []
      setEntries((current) => [...importedRows, ...current].sort((left, right) => right.transaction_date.localeCompare(left.transaction_date)))
      const importedMonth = csvRows.map((row) => row.transaction_date.slice(0, 7)).sort().at(-1)
      if (importedMonth) setSelectedMonthKey(importedMonth)
      setCsvMessage(`Imported ${importedRows.length} ${importedRows.length === 1 ? 'expense' : 'expenses'}.`)
      setCsvRows([])
      setCsvFileName('')
    } catch (importError) {
      setCsvError(ledgerSetupMessage(importError.message) || 'The CSV could not be imported. Please try again.')
    } finally {
      setImporting(false)
    }
  }

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
      setFormMessage(ledgerSetupMessage(insertError.message))
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
    if (deleteError) setError(ledgerSetupMessage(deleteError.message))
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
        <Link className="button button-secondary" to="/dashboard/profile" aria-label="Edit profile">Edit profile</Link>
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
        <article className="workspace-metric"><span>Spend in {formatMonthLabel(monthKey)} · by currency</span><strong>{totals.length ? totals.map(([currency, amount]) => money(amount, currency)).join(' · ') : 'No spend recorded'}</strong><small>Entries dated in the selected month</small></article>
        <article className="workspace-metric"><span>Vendors in {formatMonthLabel(monthKey)}</span><strong>{vendorCount}</strong><small>Unique vendor names</small></article>
        <article className="workspace-metric"><span>Records in workspace</span><strong>{entries.length}</strong><small>Visible only to your account</small></article>
      </section>

      <section className="workspace-panel csv-import-panel" aria-labelledby="csv-import-title">
        <div className="workspace-panel-heading"><div><span className="eyebrow">Bulk import</span><h2 id="csv-import-title">Upload expense CSV</h2></div><FileText size={18} /></div>
        <p className="csv-import-description">Import up to 1,000 expenses. Vendor and amount are required; category, currency, transaction date, and note are optional. Dates use YYYY-MM-DD. <a href="/sample-expenses.csv" download>Download a sample CSV</a>.</p>
        <div className="csv-import-controls">
          <label className={`csv-file-picker ${csvFileName ? 'has-file' : ''}`}>
            <input className="sr-only" type="file" accept=".csv,text/csv" aria-label="Choose expense CSV file" onChange={selectCsvFile} disabled={importing} />
            <Upload size={19} aria-hidden="true" />
            <span><strong>{csvFileName || 'Choose a CSV file'}</strong><small>CSV format · up to 5 MB</small></span>
          </label>
          {csvRows.length > 0 && <button className="button button-primary csv-import-submit" type="button" onClick={importCsv} disabled={importing}>{importing ? 'Importing…' : `Import ${csvRows.length} ${csvRows.length === 1 ? 'expense' : 'expenses'}`}<ArrowUpRight size={16} aria-hidden="true" /></button>}
        </div>
        {csvError && <p className="workspace-error" role="alert">{csvError}</p>}
        {csvMessage && <p className="workspace-success" role="status">{csvMessage}</p>}
        {csvRows.length > 0 && <div className="csv-preview">
          <strong className="csv-preview-title">Import preview</strong>
          <div className="workspace-table-scroll"><table className="workspace-table"><thead><tr><th>Vendor</th><th>Category</th><th>Amount</th><th>Date</th></tr></thead><tbody>
            {csvRows.slice(0, 5).map((row, index) => <tr key={`${row.vendor}-${index}`}><td>{row.vendor}</td><td>{row.category}</td><td>{money(row.amount, row.currency)}</td><td>{row.transaction_date}</td></tr>)}
          </tbody></table></div>
          {csvRows.length > 5 && <small className="csv-preview-count">Showing 5 of {csvRows.length} expenses.</small>}
        </div>}
      </section>

      <div className="workspace-grid">
        <div className="workspace-main-column">
          <section className="workspace-panel" aria-labelledby="activity-title">
            <div className="workspace-panel-heading"><div><span className="eyebrow">Record activity</span><h2 id="activity-title">Entries in six months through {formatMonthLabel(monthKey)}</h2></div><label className="workspace-period-control">Summary month<select aria-label="Summary month" value={monthKey} onChange={(event) => setSelectedMonthKey(event.target.value)}>{reportMonthOptions.map((option) => <option key={option} value={option}>{formatMonthLabel(option)}</option>)}</select></label></div>
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