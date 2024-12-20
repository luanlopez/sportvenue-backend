export const jwtConfig = {
  jwtSecret: process.env.ENCRYPTION_KEY,
  accessTokenExpiration: process.env.ACCESS_TOKEN_EXPIRATION || '15m',
  refreshTokenExpiration: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
};
