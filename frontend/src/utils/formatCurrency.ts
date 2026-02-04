/**
 * Very small formatter – just enough for the test.
 * Replace with your real implementation later.
 */
export function formatCurrency(value: number): string {
  // Use Intl.NumberFormat for a proper Euro format
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(value);
}
