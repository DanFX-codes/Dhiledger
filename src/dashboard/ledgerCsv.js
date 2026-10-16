import { parse } from 'csv-parse/browser/esm/sync'

const supportedCurrencies = ['USD', 'NGN', 'GBP', 'EUR']
const csvHeaderAliases = {
  vendor: ['vendor', 'merchant', 'payee', 'supplier'],
  amount: ['amount', 'total', 'cost'],
  category: ['category', 'type'],
  currency: ['currency'],
  transaction_date: ['transaction_date', 'date'],
  note: ['note', 'description', 'memo'],
}
const today = () => new Date().toISOString().slice(0, 10)

export function parseLedgerCsv(contents) {
  const records = parse(contents, { bom: true, skip_empty_lines: true, trim: true })
  if (records.length < 2) throw new Error('Add a header row and at least one expense to the CSV file.')

  const headers = records[0].map((header) => String(header).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''))
  const indexes = Object.fromEntries(Object.entries(csvHeaderAliases).map(([field, aliases]) => [
    field,
    headers.findIndex((header) => aliases.includes(header)),
  ]))
  if (indexes.vendor < 0 || indexes.amount < 0) throw new Error('The CSV needs Vendor and Amount columns.')

  return records.slice(1).map((record, index) => {
    const line = index + 2
    if (record.length !== headers.length) throw new Error(`Row ${line} has a different number of columns than the header.`)
    const value = (field) => indexes[field] < 0 ? '' : String(record[indexes[field]] || '').trim()
    const vendor = value('vendor')
    const amountText = value('amount').replace(/[,$\s]/g, '')
    const amount = Number(amountText)
    const category = value('category') || 'Other'
    const currency = (value('currency') || 'USD').toUpperCase()
    const transactionDate = value('transaction_date') || today()
    const note = value('note') || null

    if (!vendor || vendor.length > 120) throw new Error(`Row ${line} needs a vendor name of 1 to 120 characters.`)
    if (!amountText || !Number.isFinite(amount) || amount <= 0) throw new Error(`Row ${line} needs an amount greater than zero.`)
    if (!category || category.length > 80) throw new Error(`Row ${line} needs a category of 1 to 80 characters.`)
    if (!supportedCurrencies.includes(currency)) throw new Error(`Row ${line} has an unsupported currency. Use USD, NGN, GBP, or EUR.`)
    const parsedDate = new Date(`${transactionDate}T00:00:00.000Z`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== transactionDate) {
      throw new Error(`Row ${line} needs a transaction date in YYYY-MM-DD format.`)
    }
    if (note && note.length > 240) throw new Error(`Row ${line} note must be 240 characters or fewer.`)

    return { vendor, category, amount, currency, transaction_date: transactionDate, note }
  })
}