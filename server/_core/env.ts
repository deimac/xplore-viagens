export const ENV = {
  // SERVER
  nodeEnv: process.env.NODE_ENV || 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // DATABASE
  databaseUrl: process.env.DATABASE_URL,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // GOOGLE OAUTH dummy
  googleClientId: process.env.GOOGLE_CLIENT_ID || 'dummy',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy',
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT}/api/oauth/callback`,
  oauthServerUrl: process.env.OAUTH_SERVER_URL || 'http://localhost:4000',

  // FRONTEND
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || `http://localhost:${process.env.PORT}`,

  // APP / OAUTH
  appId: process.env.APP_ID || 'xplore-viagens',
  cookieSecret: process.env.COOKIE_SECRET || 'dev-cookie-secret',


  // SPA / Caddy
  spaOutputDir: process.env.NIXPACKS_SPA_OUTPUT_DIR || 'dist/public',

  // FILE STORAGE
  storageType: (process.env.STORAGE_TYPE || 'local') as 'local' | 's3',
  uploadsDir: process.env.UPLOADS_DIR || 'uploads',

  // AWS
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  awsBucket: process.env.AWS_BUCKET,

  // SMTP
  smtpEnabled: process.env.SMTP_ENABLED === 'true',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'noreply@xploreviagens.com.br',
  ownerEmail: process.env.OWNER_EMAIL,
  ownerOpenId: process.env.OWNER_OPEN_ID,

  // APP
  appName: process.env.APP_NAME || 'Xplore Viagens',
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT}`,

  // VITE
  viteLogo: process.env.VITE_APP_LOGO,
  viteTitle: process.env.VITE_APP_TITLE,
  viteAnalyticsEndpoint: process.env.VITE_ANALYTICS_ENDPOINT,
  viteAnalyticsWebsiteId: process.env.VITE_ANALYTICS_WEBSITE_ID,

  // GOOGLE MAPS
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
};

export function validateEnv(): void {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn('⚠️ Missing env vars:', missing.join(', '));
  }
  console.log('✅ Env validated');
}

export function logEnvConfig(): void {
  console.log('📋 VPS Config:', {
    NODE_ENV: ENV.nodeEnv,
    PORT: ENV.port,
    DATABASE: ENV.databaseUrl?.split('@')[1] || 'unknown',
    SPA: ENV.spaOutputDir,
  });
}

export default ENV;
