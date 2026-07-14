/**
 * Storage Service Wrapper (Legacy Entrypoint)
 * Re-exports the refactored modular storage service to maintain compatibility
 * with all existing imports in controllers and services.
 */
module.exports = require('./storage/storageService');
