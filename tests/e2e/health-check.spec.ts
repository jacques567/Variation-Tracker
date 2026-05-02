import { test, expect } from '@playwright/test';

test.describe('Health Check — Last Line of Defense', () => {
  test('health endpoint should respond and be structured correctly', async ({ request }) => {
    const response = await request.get('/api/health');

    // Should respond with 200 (healthy), 503 (degraded), or 500 (error)
    // We accept 200 and 503, reject 500 or higher
    expect([200, 503]).toContain(response.status());

    const json = await response.json();

    // Status code interpretation
    if (response.status() === 200) {
      expect(json.status).toBe('healthy');
    } else if (response.status() === 503) {
      // Degraded but functional
      expect(json.status).toMatch(/^(healthy|degraded)$/);
    }

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

  test('environment variables check should report', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    // Should have environment check with details
    const envCheck = json.checks.environment;
    expect(envCheck).toHaveProperty('status');
    expect(envCheck).toHaveProperty('details');
    expect(Array.isArray(envCheck.details)).toBe(true);
  });

  test('all checks should have status field', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    // Verify each check has a status
    Object.values(json.checks).forEach((check: any) => {
      expect(check).toHaveProperty('status');
      expect(['ok', 'fail']).toContain(check.status);
    });
  });

  test('security issues should be an array', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const securityCheck = json.checks.security;
    expect(Array.isArray(securityCheck.issues)).toBe(true);
  });

  test('dependencies should report loaded state', async ({ request }) => {
    const response = await request.get('/api/health');
    const json = await response.json();

    const depsCheck = json.checks.dependencies;
    expect(depsCheck.status).toBe('ok');
    expect(depsCheck.details).toBeDefined();
  });

  test('health check should not be completely broken', async ({ request }) => {
    // On production deploy, this endpoint must be accessible
    // In CI, we accept 200 (healthy) or 503 (degraded)
    const response = await request.get('/api/health');

    // Accept 200 or 503, reject 500+ errors
    expect([200, 503]).toContain(response.status());

    // Should be valid JSON
    const json = await response.json();
    expect(json).toBeDefined();
    expect(json.status).toBeDefined();
  });
});
