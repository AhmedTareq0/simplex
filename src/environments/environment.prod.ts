export const environment = {
  // ============ Environment ============
  production: true,
  stage: 'production',

  // ============ API ============
  apiUrl: 'https://api-simplex.envsabqpro.site',
  websocketUrl: 'wss://api-simplex.envsabqpro.site/ws/chat',
  apiTimeout: 30000,

  // =========== Logging & Debug ==========
  enableLogging: false,
  enableErrorTracking: true,
  enableConsoleLog: false,

  // ========== Features ===========
  features: {
    analytics: true,
    errorTracking: true,
    mockData: false,
  },
};
