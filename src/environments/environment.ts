export const environment = {
  // ============ Environment ============
  production: false,
  stage: 'development',

  // ============ API ============
  apiUrl: 'https://135.181.24.133',
  apiTimeout: 30000,

  // ============ Logging & Debug ============
  enableLogging: true,
  enableErrorTracking: false,
  enableConsoleLog: true,

  // ============ Features ============
  features: {
    analytics: false,
    errorTracking: false,
    mockData: false,
  },
};
