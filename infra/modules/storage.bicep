/*
  Módulo: Azure Blob Storage
  ===========================
  Almacena las portadas de los discos de vinilo.

  Container: vinyl-covers (acceso público a nivel Blob)
  Razón: Permite cargar imágenes directamente desde el frontend
         sin pasar por la API (reduce latencia y costos de egress).

  ⚠️ Consideración de seguridad:
    En producción con contenido sensible, cambiar publicAccess a 'None'
    y usar SAS tokens o Azure CDN con token auth para acceso a las imágenes.
*/

param accountName string
param location string
param containerName string

// ---------------------------------------------------------------------------
// Storage Account
// ---------------------------------------------------------------------------
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: accountName
  location: location
  sku: {
    name: 'Standard_LRS'  // Locally Redundant Storage — más económico
  }
  kind: 'StorageV2'
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true    // Requerido para imágenes de portada públicas
    accessTier: 'Hot'
  }
}

// ---------------------------------------------------------------------------
// Blob Service
// ---------------------------------------------------------------------------
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          // Permitir acceso desde Static Web App y localhost
          allowedOrigins: [ '*' ]  // TODO: Restringir a dominios específicos en producción
          allowedMethods: [ 'GET', 'HEAD' ]
          allowedHeaders: [ '*' ]
          exposedHeaders: [ '*' ]
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

// ---------------------------------------------------------------------------
// Container de portadas
// ---------------------------------------------------------------------------
resource coversContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'Blob'  // Las imágenes son públicamente accesibles por URL
    metadata: {
      purpose: 'vinyl-cover-images'
    }
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output accountName string = storageAccount.name
output primaryEndpoint string = storageAccount.properties.primaryEndpoints.blob
