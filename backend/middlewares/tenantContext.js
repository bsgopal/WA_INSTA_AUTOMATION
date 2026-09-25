// renic-automation-backend/middlewares/tenantContext.js
const { AsyncLocalStorage } = require('async_hooks');
const { getTenantModel, getTenantDb } = require('../config/tenantConnectionManager');

const tenantStorage = new AsyncLocalStorage();

/**
 * Execute a function within a specific tenant context
 */
function runWithTenant(customerCode, fn) {
  const code = (customerCode || 'DEFAULT').trim().toUpperCase();
  return tenantStorage.run(code, fn);
}

/**
 * Get current customer code from context
 */
function getCurrentTenant() {
  return tenantStorage.getStore() || 'DEFAULT';
}

/**
 * Get a model bound to the active tenant's isolated database
 */
function getModel(modelName) {
  const tenantCode = getCurrentTenant();
  return getTenantModel(tenantCode, modelName);
}

/**
 * Get the current tenant DB connection
 */
function getCurrentTenantDb() {
  const tenantCode = getCurrentTenant();
  return getTenantDb(tenantCode);
}

module.exports = {
  runWithTenant,
  getCurrentTenant,
  getModel,
  getCurrentTenantDb,
  tenantStorage
};
