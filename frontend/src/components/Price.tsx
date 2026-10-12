export function formatMoney(value: number, currency = 'INR') {
  const amount = value / 100;
  // StyleHub operates in INR (₹)
  const normalizedCurrency = (!currency || currency.toUpperCase() === 'USD') ? 'INR' : currency.toUpperCase();
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function Price({ amount, currency = 'INR' }: { amount: number; currency?: string }) {
  return <span>{formatMoney(amount, currency)}</span>;
}
