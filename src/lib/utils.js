import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

/**
 * Format currency amount
 */
export function formatCurrency(amount, symbol = 'PKR ') {
  return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
}

/**
 * Format date for display
 */
export function formatDate(date, fmt = 'MMM dd, yyyy') {
  if (!date) return '';
  return format(new Date(date), fmt);
}

/**
 * Format datetime for display
 */
export function formatDateTime(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

/**
 * Generate unique sale number
 */
export function generateSaleNumber() {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${date}-${random}`;
}

/**
 * Generate unique purchase number
 */
export function generatePurchaseNumber() {
  const date = format(new Date(), 'yyyyMMdd');
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `PO-${date}-${random}`;
}

/**
 * Get date range for filters
 */
export function getDateRange(period) {
  const now = new Date();
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items, discountAmount = 0, taxRate = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = parseFloat(discountAmount) || 0;
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * (parseFloat(taxRate) / 100);
  const total = taxableAmount + tax;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

/**
 * Sanitize string for SQL (basic)
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number
 */
export function isValidPhone(phone) {
  const re = /^[\d\s\+\-\(\)]{7,20}$/;
  return re.test(phone);
}

/**
 * Parse pagination params from request
 */
export function getPaginationParams(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Build success response
 */
export function successResponse(data, message = 'Success') {
  return { success: true, message, data };
}

/**
 * Build error response
 */
export function errorResponse(message = 'An error occurred', code = 500) {
  return { success: false, error: message };
}

/**
 * Get client IP from request
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.socket?.remoteAddress ||
    ''
  );
}

/**
 * Format number with commas
 */
export function formatNumber(num) {
  return new Intl.NumberFormat().format(num || 0);
}
