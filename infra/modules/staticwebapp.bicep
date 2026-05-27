/*
  Módulo: Azure Static Web Apps
  ==============================
  Despliega el hosting del frontend React (Vite build).

  Free Tier incluye:
    - Hosting estático global (CDN incluido)
    - SSL/HTTPS automático
    - Custom domains
    - GitHub Actions deployment integrado
    - 100 GB de bandwidth/mes
    - No incluye Azure Functions built-in (usamos nuestra propia Function App)

  El despliegue del contenido se hace vía GitHub Actions (frontend-ci.yml),
  no via este template Bicep.
*/

param appName string
param location string

@description('URL del repositorio GitHub (opcional — para integración automática)')
param repositoryUrl string = ''

@description('Rama principal del repositorio')
param branch string = 'main'

// ---------------------------------------------------------------------------
// Static Web App
// ---------------------------------------------------------------------------
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: appName
  location: location
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: branch
    buildProperties: {
      appLocation: 'frontend'        // Carpeta del proyecto React
      outputLocation: 'dist'         // Output de `npm run build`
      apiLocation: ''                // API manejada por Azure Functions, no SWA built-in
    }
    // stagingEnvironmentPolicy: 'Enabled'  // Descomentar para preview deployments en PRs
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output defaultHostName string = staticWebApp.properties.defaultHostname
output staticWebAppName string = staticWebApp.name
// El deployment token se usa en el workflow de GitHub Actions
// output deploymentToken string = listSecrets(staticWebApp.id, staticWebApp.apiVersion).properties.apiKey
