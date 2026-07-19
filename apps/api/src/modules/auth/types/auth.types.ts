export type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayUsername: string | null;
  name: string;
};

export type RequestSession = {
  id: string;
  userId: string;
};

export type AccessTokenClaims = {
  userId: string;
  sessionId: string;
};

export type SessionDeviceInfo = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

export type IssuedSession = {
  sessionId: string;
  userId: string;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
};
