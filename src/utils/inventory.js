import { daysUntil } from './date';

export const isLow = (item) => item.quantity <= item.lowStockThreshold;
export const isExpiring = (item, days = 30) => daysUntil(item.expiryDate) <= days;
