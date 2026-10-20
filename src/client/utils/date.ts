export function getIsoDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function formatTime(isoString?: string | null): string {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(isoString?: string | null): string {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Formats a date string (YYYY-MM-DD or ISO timestamp) into DD-MM-YYYY format (e.g. 29-10-2026).
 * Handles YYYY-MM-DD strings directly to prevent timezone day shift.
 */
export function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const str = String(dateStr).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}-${month}-${year}`;
  }
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return str;
}

