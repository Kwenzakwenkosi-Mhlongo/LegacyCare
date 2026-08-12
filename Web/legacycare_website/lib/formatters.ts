export function formatDate(date?: string | null): string {
  if (!date) {
    return "Not Available";
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }
  return parsedDate.toLocaleDateString("en-ZA");
}

export function formatCurrency(amount: number): string {
  return `R ${amount.toFixed(2)}`;
}

export function formatPolicyId(policyId: string): string {
  if (!policyId) return "N/A";
  return policyId.substring(0, 8).toUpperCase();
}