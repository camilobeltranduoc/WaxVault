/*
  WaxVault — Azure Bicep IaC (Infrastructure as Code)
  =====================================================
  Este archivo despliega toda la infraestructura necesaria en Azure.

  Servicios desplegados:
    - Azure Cosmos DB (NoSQL API) con 3 containers
    - Azure Blob Storage (portadas de vinilos)
    - Azure Functions (backend FastAPI, Consumption Plan, Linux)
    - Azure Static Web Apps (frontend React)

  Uso:
    az group create --name waxvault-dev --location eastus
    az deployment group create \
      --resource-group waxvault-dev \
      --template-file infra/main.bicep \
      --parameters environmentName=dev
*/

targetScope = 'resourceGroup'

@description('Nombre del ambiente (dev, staging, prod)')
param environmentName string = 'dev'

@description('Región de Azure para todos los recursos')
param location string = resourceGroup().location

@description('Prefijo del proyecto para nombres de recursos')
param projectName string = 'waxvault'

@description('Object ID del usuario desplegador (az ad signed-in-user show --query id -o tsv)')
param deployerObjectId string = ''

// ---------------------------------------------------------------------------
// Nombres de recursos (prefijo-ambiente-servicio)
// ---------------------------------------------------------------------------
var resourcePrefix = '${projectName}-${environmentName}'

// ---------------------------------------------------------------------------
// Módulos
// ---------------------------------------------------------------------------

module cosmosDb 'modules/cosmosdb.bicep' = {
  name: 'cosmosdb-deployment'
  params: {
    accountName: '${resourcePrefix}-cosmos'
    location: location
    databaseName: 'waxvault'
  }
}

module storage 'modules/storage.bicep' = {
  name: 'storage-deployment'
  params: {
    // Los nombres de Storage Accounts no pueden tener guiones y max 24 chars
    accountName: toLower(take(replace('${resourcePrefix}stor', '-', ''), 24))
    location: location
    containerName: 'vinyl-covers'
  }
}

module functionApp 'modules/functionapp.bicep' = {
  name: 'functionapp-deployment'
  params: {
    appName: '${resourcePrefix}-api'
    location: location
    storageAccountName: storage.outputs.accountName
    keyVaultName: '${resourcePrefix}-kv'
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'keyvault-deployment'
  params: {
    vaultName: take(replace('${resourcePrefix}-kv', '-', ''), 24)  // KV names: max 24 chars, no trailing hyphens
    location: location
    functionAppIdentityObjectId: functionApp.outputs.principalId
    deployerObjectId: deployerObjectId
  }
}

module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'staticwebapp-deployment'
  params: {
    appName: '${resourcePrefix}-web'
    location: location
  }
}

// ---------------------------------------------------------------------------
// Outputs — útiles para configurar CI/CD y variables de entorno
// ---------------------------------------------------------------------------
output functionAppUrl string = 'https://${functionApp.outputs.defaultHostName}'
output staticWebAppUrl string = 'https://${staticWebApp.outputs.defaultHostName}'
output cosmosEndpoint string = cosmosDb.outputs.endpoint
output storageAccountName string = storage.outputs.accountName
output keyVaultUri string = keyVault.outputs.vaultUri
output functionAppIdentityId string = functionApp.outputs.principalId
