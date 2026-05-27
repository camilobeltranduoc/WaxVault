/*
  Módulo: Azure Cosmos DB (NoSQL API)
  =====================================
  Crea la cuenta Cosmos DB y los 3 containers del dominio de WaxVault.

  Containers y partition keys:
    - vinyls      → /status       (query dominante: por estado de aprobación)
    - users       → /b2c_object_id (query dominante: por ID de usuario)
    - collection  → /user_id       (query dominante: todos los discos de un usuario)

  Throughput: 400 RU/s shared (mínimo y más económico).
  Free tier: Habilitado (hasta 1000 RU/s y 25 GB gratis — solo 1 por suscripción).
*/

param accountName string
param location string
param databaseName string

// ---------------------------------------------------------------------------
// Cuenta Cosmos DB
// ---------------------------------------------------------------------------
resource cosmosAccount 'Microsoft.DocumentDB/databaseAccounts@2024-05-15' = {
  name: accountName
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    consistencyPolicy: {
      defaultConsistencyLevel: 'Session'  // Balance entre consistency y performance
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    enableAutomaticFailover: false
    // ⚠️ Deshabilitar enableFreeTier en producción si ya usas Free Tier en otra cuenta
    enableFreeTier: true
  }
}

// ---------------------------------------------------------------------------
// Base de datos
// ---------------------------------------------------------------------------
resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2024-05-15' = {
  parent: cosmosAccount
  name: databaseName
  properties: {
    resource: {
      id: databaseName
    }
    options: {
      throughput: 400  // Shared throughput entre containers
    }
  }
}

// ---------------------------------------------------------------------------
// Containers
// ---------------------------------------------------------------------------
var containers = [
  { name: 'vinyls',      partitionKey: '/status' }
  { name: 'users',       partitionKey: '/b2c_object_id' }
  { name: 'collection',  partitionKey: '/user_id' }
]

resource cosmosContainers 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases/containers@2024-05-15' = [
  for container in containers: {
    parent: database
    name: container.name
    properties: {
      resource: {
        id: container.name
        partitionKey: {
          paths: [ container.partitionKey ]
          kind: 'Hash'
          version: 2
        }
        indexingPolicy: {
          indexingMode: 'consistent'
          automatic: true
        }
      }
    }
  }
]

// ---------------------------------------------------------------------------
// Outputs
// ---------------------------------------------------------------------------
output accountName string = cosmosAccount.name
output endpoint string = cosmosAccount.properties.documentEndpoint
