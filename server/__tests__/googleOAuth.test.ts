import { describe, it, expect } from 'vitest';
import { OAuth2Client } from 'google-auth-library';

describe('Google OAuth Configuration', () => {
  it('should have valid GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET', () => {
    expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
    expect(process.env.GOOGLE_CLIENT_ID).toMatch(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/);
    expect(process.env.GOOGLE_CLIENT_SECRET).toMatch(/^GOCSPX-/);
  });

  it('should create OAuth2Client successfully', () => {
    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    expect(client).toBeDefined();
    expect(client._clientId).toBe(process.env.GOOGLE_CLIENT_ID);
  });
});
