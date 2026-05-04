export const environment = {
  // ============ Environment ============
  production: true,
  stage: 'production',

  // ============ API ============
  apiUrl: 'http://135.181.24.133',
  apiTimeout: 30000,

  // ============ Logging & Debug ============
  enableLogging: false,
  enableErrorTracking: true,
  enableConsoleLog: false,

  // ============ Features ============
  features: {
    analytics: true,
    errorTracking: true,
    mockData: false,
  },
};
