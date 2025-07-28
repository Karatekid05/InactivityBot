export function parseDuration(str) {
  if (!str) return null;
  const regex = /(?:(\d+)d)?\s*(?:(\d+)h)?\s*(?:(\d+)m)?/i;
  const match = str.match(regex);
  if (!match) return null;
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  if (days === 0 && hours === 0 && minutes === 0) return null;
  return days * 86400 + hours * 3600 + minutes * 60;
} 