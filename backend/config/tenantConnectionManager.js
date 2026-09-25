// renic-automation-backend/config/tenantConnectionManager.js
const mongoose = require('mongoose');

// Cache of model schemas
const schemaRegistry = new Map();

/**
 * Register or get a schema from registry
 */
function registerModelSchema(name, schema) {
  if (schema) {
    schemaRegistry.set(name, schema);
  }
}

/**
 * Automatically loads schema from default mongoose models
 */
function getOrLoadSchema(modelName) {
  if (schemaRegistry.has(modelName)) {
    return schemaRegistry.get(modelName);
  }
  try {
    const existingModel = mongoose.models[modelName];
    if (existingModel && existingModel.schema) {
      schemaRegistry.set(modelName, existingModel.schema);
      return existingModel.schema;
    }
  } catch (err) {
    // silent
  }
  return null;
}

/**
 * Returns a Mongoose connection/DB handle for the given customerCode.
 * Uses connection.useDb(dbName, { useCache: true }) to reuse the connection pool.
 */
function getTenantDb(customerCode) {
  const code = (customerCode || 'DEFAULT').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const dbName = `renic_tenant_${code}`;

  if (!mongoose.connection || mongoose.connection.readyState !== 1) {
    throw new Error(`MongoDB master connection is not ready (readyState: ${mongoose.connection?.readyState})`);
  }

  return mongoose.connection.useDb(dbName, { useCache: true });
}

/**
 * Returns a model bound strictly to the given tenant's database.
 */
function getTenantModel(customerCode, modelName) {
  const tenantDb = getTenantDb(customerCode);

  if (tenantDb.models[modelName]) {
    return tenantDb.models[modelName];
  }

  const schema = getOrLoadSchema(modelName);
  if (!schema) {
    throw new Error(`Schema for model '${modelName}' is not registered`);
  }

  return tenantDb.model(modelName, schema);
}

module.exports = {
  getTenantDb,
  getTenantModel,
  registerModelSchema
};
