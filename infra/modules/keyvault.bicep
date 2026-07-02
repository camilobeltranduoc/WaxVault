/*
  Módulo: Azure Key Vault
  ========================
  Almacena todos los secretos de la aplicación de forma segura.

  Secrets almacenados:
    - cosmos-db-key              → clave primaria de Cosmos DB
    - blob-storage-connection    → connection string de Azure Storage
    - discogs-api-token          → personal access token de Discogs
    - b2c-client-id              → client ID de la app registration en B2C
    - b2c-jwks-uri               → endpoint JWKS para validar JWT de B2C

  Acceso: Access Policies (sin RBAC) para compatibilidad con permisos institucionales.
  El Function App accede a los secretos via Managed Identity (sin credenciales).
*/

param vaultName string
param location string

@description('Object ID del Managed Identity del Function App (para leer secretos)')
param functionAppIdentityObjectId string

@description('Object ID del usuario desplegador (para gestionar secretos via CLI/Portal)')
param deployerObjectId string

// ---------------------------------------------------------------------------
// Key Vault (Access Policies mode)
// ---------------------------------------------------------------------------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: vaultName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableRbacAuthorization: false   // Access Policies para compatibilidad con permisos institucionales
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enabledForTemplateDeployment: true
    accessPolicies: [
      // Function App: solo lectura de secretos (principio de mínimo privilegio)
      {
        tenantId: subscription().tenantId
        objectId: functionAppIdentityObjectId
        permissions: {
          secrets: [ 'get', 'list' ]
        }
      }
      // Deployer (cuenta DUOC): gestión completa para set/delete durante CI-CD
      {
        tenantId: subscription().tenantId
        objectId: deployerObjectId
        permissions: {
          secrets: [ 'get', 'list', 'set', 'delete', 'recover', 'backup', 'restore' ]
        }
      }
    ]
  }
}

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output vaultName string = keyVault.name
output vaultUri string = keyVault.properties.vaultUri
