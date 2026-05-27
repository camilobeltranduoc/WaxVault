/**
 * Funciones utilitarias de formateo para WaxVault.
 */

/**
 * Formatea un valor numérico como moneda.
 * @param {number|null|undefined} value - Valor en USD.
 * @param {string} currency - Código de moneda ISO 4217.
 * @param {string} locale - Locale para formateo.
 * @returns {string} Valor formateado (ej: "$1,234.56") o "N/A".
 */
export function formatCurrency(value, currency = 'USD', locale = 'en-US') {
  if (value == null || isNaN(value)) return 'N/A'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formatea una fecha ISO string a formato legible.
 * @param {string|Date|null} dateInput - Fecha a formatear.
 * @param {string} locale - Locale para formateo.
 * @returns {string} Fecha formateada (ej: "Jan 15, 2024") o "—".
 */
export function formatDate(dateInput, locale = 'es-CL') {
  if (!dateInput) return '—'
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Trunca un string a un máximo de caracteres.
 * @param {string|null} str - String a truncar.
 * @param {number} maxLength - Longitud máxima.
 * @returns {string} String truncado con "..." si excede el máximo.
 */
export function truncate(str, maxLength = 50) {
  if (!str) return ''
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str
}

/**
 * Convierte el código de condición de vinilo a etiqueta legible.
 * @param {string} code - Código de condición (M, NM, VG+, etc.)
 * @returns {string} Etiqueta descriptiva.
 */
export function formatCondition(code) {
  const map = {
    M: 'Mint',
    NM: 'Near Mint',
    'VG+': 'Very Good Plus',
    VG: 'Very Good',
    'G+': 'Good Plus',
    G: 'Good',
    F: 'Fair',
    P: 'Poor',
  }
  return map[code] || code || '—'
}

/**
 * Calcula y formatea la ganancia/pérdida de una entrada de colección.
 * @param {number} marketPrice - Precio actual de mercado.
 * @param {number} purchasePrice - Precio de compra.
 * @returns {{ value: number, formatted: string, isGain: boolean }}
 */
export function formatProfitLoss(marketPrice, purchasePrice) {
  if (!marketPrice || !purchasePrice) {
    return { value: 0, formatted: 'N/A', isGain: false }
  }
  const diff = marketPrice - purchasePrice
  const isGain = diff >= 0
  return {
    value: diff,
    formatted: `${isGain ? '+' : ''}${formatCurrency(diff)}`,
    isGain,
  }
}

/**
 * Formatea el año de un vinilo.
 * @param {number|null} year
 * @returns {string}
 */
export function formatYear(year) {
  return year ? String(year) : 'Año desconocido'
}
