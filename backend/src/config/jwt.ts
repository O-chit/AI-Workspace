import { env } from './env.js';

export const jwtConfig = {
  accessSecret: env.JWT_ACCESS_SECRET,
  accessExpiresIn: env.JWT_ACCESS_EXPIRES,
  refreshSecret: env.JWT_REFRESH_SECRET,
  refreshExpiresIn: env.JWT_REFRESH_EXPIRES,
};
