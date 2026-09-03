export function truncateAddress(address: string, lead = 6, trail = 4): string {
  if (address.length <= lead + trail + 2) return address;
  return `${address.slice(0, lead)}…${address.slice(address.length - trail)}`;
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatRelativeToNow(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const absMinutes = Math.abs(diffMinutes);

  if (absMinutes < 1) return "just now";
  if (absMinutes < 60) {
    return diffMinutes > 0 ? `in ${absMinutes} min` : `${absMinutes} min ago`;
  }
  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return diffHours > 0 ? `in ${absHours}h` : `${absHours}h ago`;
  }
  const diffDays = Math.round(diffHours / 24);
  return diffDays > 0 ? `in ${diffDays}d` : `${Math.abs(diffDays)}d ago`;
}

export function formatCountdown(expiryIso: string): string {
  const diffMs = new Date(expiryIso).getTime() - Date.now();
  if (diffMs <= 0) return "Expired";
  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);
  if (hours >= 48) return `${Math.floor(hours / 24)} days remaining`;
  if (hours >= 1) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}

export function formatAmount(amount: string, symbol: string): string {
  const numeric = Number(amount);
  if (Number.isNaN(numeric)) return `${amount} ${symbol}`;
  return `${new Intl.NumberFormat("en-US").format(numeric)} ${symbol}`;
}
