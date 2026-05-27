/**
 * Claves de cache para TanStack Query.
 *
 * Centralizar las query keys evita typos y facilita la invalidación
 * selectiva del cache después de mutations (ej: invalidar COLLECTION
 * después de agregar un disco).
 *
 * Patrón: las queries que aceptan parámetros usan el key como prefijo
 * y el parámetro como segundo elemento del array:
 *   [QUERY_KEYS.VINYL_DETAIL, vinylId]
 *   [QUERY_KEYS.CATALOG_SEARCH, searchTerm, page]
 */
export const QUERY_KEYS = Object.freeze({
  // Módulo A — Catálogo público
  CATALOG: 'catalog',
  CATALOG_SEARCH: 'catalogSearch',
  VINYL_DETAIL: 'vinylDetail',

  // Módulo B — Colección personal
  COLLECTION: 'collection',
  COLLECTION_ENTRY: 'collectionEntry',
  DASHBOARD_STATS: 'dashboardStats',
  VALUATION_HISTORY: 'valuationHistory',

  // Módulo C — Admin
  ADMIN_USERS: 'adminUsers',
  ADMIN_USER_DETAIL: 'adminUserDetail',
  ADMIN_CATALOG: 'adminCatalog',
  ADMIN_APPROVALS: 'adminApprovals',
})
