import { test, expect } from '@playwright/test';

test.describe('Health Check — Last Line of Defense', () => {
  test('should pass all security checks before deployment', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    // Status code should be 200 (healthy) or 503 (degraded, but functional)
    expect([200, 503]).toContain(response.status());

    // Overall status must be "healthy" or "degraded" (not "unhealthy")
    expect(json.status).toMatch(/^(healthy|degraded)$/);

    // Timestamp present and valid
    expect(json.timestamp).toBeDefined();
    expect(new Date(json.timestamp)).toBeInstanceOf(Date);

    // All check categories present
    expect(json.checks).toHaveProperty('environment');
    expect(json.checks).toHaveProperty('database');
    expect(json.checks).toHaveProperty('stripe');
    expect(json.checks).toHaveProperty('security');
    expect(json.checks).toHaveProperty('dependencies');
  });

  test('environment variables should be configured', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const envCheck = json.checks.environment;
    expect(envCheck.status).toBe('ok');
    expect(envCheck.details.length).toBeGreaterThan(0);
  });

  test('database connectivity should be working', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const dbCheck = json.checks.database;
    expect(dbCheck.status).toBe('ok');
    expect(dbCheck.error).toBeUndefined();
  });

  test('Stripe configuration should be complete', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const stripeCheck = json.checks.stripe;
    expect(stripeCheck.status).toBe('ok');
    expect(stripeCheck.error).toBeUndefined();
  });

  test('security checks should have no critical issues', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const securityCheck = json.checks.security;
    expect(securityCheck.status).toBe('ok');
    expect(securityCheck.issues.length).toBe(0);
  });

  test('dependencies should be loaded', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const depsCheck = json.checks.dependencies;
    expect(depsCheck.status).toBe('ok');
    expect(depsCheck.details).toContain('loaded');
  });

  test('NODE_ENV should be production on deploy', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    // If unhealthy due to NODE_ENV, deployment should fail
    if (json.status === 'unhealthy') {
      const hasBadEnv = json.checks.security.issues.some(
        (issue: string) => issue.includes('NODE_ENV') && !issue.includes('production')
      );
      expect(hasBadEnv).toBe(false);
    }
  });
});
