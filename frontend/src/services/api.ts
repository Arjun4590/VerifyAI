import {
  localApi,
  setDemoRole,
  getDemoRole,
  getDemoUsername,
  resetLocalDemoData
} from './localDataService';

export { setDemoRole, getDemoRole, getDemoUsername, resetLocalDemoData };

// Drop-in local replacement for all network API requests
export const api = localApi;
