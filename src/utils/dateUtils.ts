import { formatDistanceToNow } from 'date-fns';

export function formatTimestamp(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatFullDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}