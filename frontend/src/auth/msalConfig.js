/**
 * Configuración de Microsoft Authentication Library (MSAL) para Azure AD B2C.
 *
 * Flujo de autenticación:
 *   1. Usuario hace click en "Iniciar sesión"
 *   2. MSAL redirige al portal de B2C (user flow B2C_1_signupsignin)
 *   3. B2C emite un id_token y un access_token (JWT firmado con RS256)
 *   4. MSAL cachea los tokens en sessionStorage
 *   5. El interceptor de axios adjunta el access_token a cada request al backend
 *
 * Variables de entorno requeridas (ver frontend/.env.example):
 *   VITE_B2C_TENANT, VITE_B2C_TENANT_ID, VITE_B2C_CLIENT_ID,
 *   VITE_B2C_POLICY, VITE_B2C_API_SCOPE, VITE_REDIRECT_URI
 */

import { LogLevel, PublicClientApplication } from '@azure/msal-browser'

// ---------------------------------------------------------------------------
// Políticas B2C (User Flows)
// ---------------------------------------------------------------------------
const b2cPolicies = {
  names: {
    signUpSignIn: import.meta.env.VITE_B2C_POLICY || 'B2C_1_signupsignin',
  },
  authorities: {
    signUpSignIn: {
      authority: `https://${import.meta.env.VITE_B2C_TENANT}/${import.meta.env.VITE_B2C_TENANT_ID}/${import.meta.env.VITE_B2C_POLICY || 'B2C_1_signupsignin'}`,
    },
  },
  authorityDomain: import.meta.env.VITE_B2C_TENANT || '',
}

// ---------------------------------------------------------------------------
// Configuración principal de MSAL
// ---------------------------------------------------------------------------
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_B2C_CLIENT_ID || '',
    authority: b2cPolicies.authorities.signUpSignIn.authority,
    // knownAuthorities evita que MSAL rechace el dominio B2C personalizado
    knownAuthorities: [b2cPolicies.authorityDomain],
    redirectUri: import.meta.env.VITE_REDIRECT_URI || window.location.origin,
    postLogoutRedirectUri: '/',
  },
  cache: {
    // sessionStorage: mejor balance seguridad/UX para B2C
    // localStorage persistiría entre pestañas pero aumenta riesgo XSS
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        // No loguear en producción ni datos PII
        if (containsPii || import.meta.env.PROD) return
        switch (level) {
          case LogLevel.Error:
            console.error('[MSAL]', message)
            break
          case LogLevel.Warning:
            console.warn('[MSAL]', message)
            break
          case LogLevel.Info:
            console.info('[MSAL]', message)
            break
          case LogLevel.Verbose:
            console.debug('[MSAL]', message)
            break
        }
      },
    },
  },
}

// ---------------------------------------------------------------------------
// Scopes de la request de login
// El scope incluye el acceso a la API del backend (access_as_user)
// ---------------------------------------------------------------------------
export const loginRequest = {
  scopes: [
    import.meta.env.VITE_B2C_API_SCOPE,
  ].filter(Boolean),
}

// ---------------------------------------------------------------------------
// Instancia de MSAL — singleton compartido por toda la app
// MsalProvider (en main.jsx) llama initialize() y handleRedirectPromise()
// internamente. No los llamamos aquí para evitar la carrera de concurrencia
// que deja inProgress atascado en 'handleRedirect'.
// ---------------------------------------------------------------------------
export const msalInstance = new PublicClientApplication(msalConfig)
