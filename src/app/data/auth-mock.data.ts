export const MOCK_AUTH_LOGIN = {
  token: 'mock-jwt-token-xxx-yyy-zzz',
  user: {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
  },
};

export const MOCK_AUTH_REGISTER = {
  verificationRequired: true,
};

export const MOCK_AUTH_VERIFY = {
  token: 'mock-jwt-token-verified',
};
