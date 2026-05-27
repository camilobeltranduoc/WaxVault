/**
 * Roles de usuario de WaxVault.
 * Deben coincidir exactamente con los valores del atributo
 * 'extension_roles' en Azure AD B2C.
 */
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  COLLECTOR: 'collector',
})
