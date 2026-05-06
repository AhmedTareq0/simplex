export const environment = {
  // ============ Environment ============
  production: false,
  stage: 'development',

  // ============ API ============
  apiUrl: 'https://api-simplex.envsabqpro.site',
  websocketUrl: 'wss://api-simplex.envsabqpro.site/ws/chat',
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
