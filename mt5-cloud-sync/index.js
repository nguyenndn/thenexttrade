const cloudSync = require('./CloudSyncService');

module.exports = {
  ...cloudSync,
  default: cloudSync.CloudSyncService
};
