/*
  Módulo: Azure Functions (Python v2 — FastAPI)
  ===============================================
  Despliega la Azure Function App en un Consumption Plan Linux
  con Python 3.12 para ejecutar el backend FastAPI de WaxVault.

  Plan Consumption:
    - Escala a 0 cuando no hay tráfico (costo $0 en idle)
    - Facturación por ejecución (muy económico para apps académicas)
    - Cold start: ~2-5 segundos en la primera request
    - Alternativa para producción: Premium Plan (sin cold start)
*/

param appName string
param location string
param storageAccountName string

// Referencia existente a la Storage Account (no la re-crea)
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' existing = {
  name: storageAccountName
}

// ---------------------------------------------------------------------------
// App Service Plan (Consumption — Linux)
// ---------------------------------------------------------------------------
resource hostingPlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: '${appName}-plan'
  location: location
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  kind: 'linux'
  properties: {
    reserved: true  // Requerido para Linux
  }
}

// ---------------------------------------------------------------------------
// Application Insights (telemetría y monitoreo)
// ---------------------------------------------------------------------------
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${appName}-insights'
  location: location
  kind: 'web'
  properties: {
    Application_Type: 'web'
    RetentionInDays: 30
  }
}

// ---------------------------------------------------------------------------
// Function App
// ---------------------------------------------------------------------------
resource functionApp 'Microsoft.Web/sites@2023-12-01' = {
  name: appName
  location: location
  kind: 'functionapp,linux'
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    siteConfig: {
      pythonVersion: '3.12'
      linuxFxVersion: 'Python|3.12'
      appSettings: [
        { name: 'FUNCTIONS_EXTENSION_VERSION', value: '~4' }
        { name: 'FUNCTIONS_WORKER_RUNTIME', value: 'python' }
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};AccountKey=${storageAccount.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
        }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        // Las variables sensibles (Cosmos, Blob, B2C, Discogs) se configuran
        // manualmente post-deploy via Azure Portal o az functionapp config appsettings set
      ]
      cors: {
        allowedOrigins: [
          'https://portal.azure.com'
          // TODO: Agregar el dominio del Static Web App post-deploy
        ]
        supportCredentials: false
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output defaultHostName string = functionApp.properties.defaultHostName
output functionAppName string = functionApp.name
output appInsightsInstrumentationKey string = appInsights.properties.InstrumentationKey
