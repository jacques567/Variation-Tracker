import { test, expect } from '@playwright/test';

/**
 * Guards the contractor signed-notification path added to POST /api/sign.
 *
 * The notification work runs AFTER the signature is committed and is deliberately
 * best-effort — no email failure may change the response the signing client gets.
 * These tests pin the route's contract at its guard clauses, which is as far as an
 * unauthenticated suite can reach without a seeded contractor + live token.
 */
test.describe('Signed notification — /api/sign contract', () => {
  test('rejects a request with missing fields before touching notifications', async ({ request }) => {
    const response = await request.post('/api/sign', {
      data: { variationId: 'abc' },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.code).toBe('missing_fields');
  });

  test('rejects an invalid CSRF token without a server error', async ({ request }) => {
    const response = await request.post('/api/sign', {
      data: {
        variationId: '00000000-0000-0000-0000-000000000000',
        token: '00000000-0000-0000-0000-000000000000',
        clientName: 'Test Client',
        signatureData: 'data:image/png;base64,iVBORw0KGgo=',
        csrfToken: 'not-a-real-csrf-token',
      },
    });

    // 403, never 500 — a regression here would mean the notification code is
    // throwing on a path that should have short-circuited long before it.
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.code).toBe('invalid_token');
  });

  test('never leaks contractor details in an error response', async ({ request }) => {
    const response = await request.post('/api/sign', {
      data: {
        variationId: '00000000-0000-0000-0000-000000000000',
        token: '00000000-0000-0000-0000-000000000000',
        clientName: 'Test Client',
        signatureData: 'data:image/png;base64,iVBORw0KGgo=',
        csrfToken: 'not-a-real-csrf-token',
      },
    });

    const raw = await response.text();
    expect(raw).not.toContain('@');
    expect(raw.toLowerCase()).not.toContain('contractor');
  });
});

test.describe('Signed notification — cron reconciliation', () => {
  test('sweep endpoint rejects an unauthenticated caller', async ({ request }) => {
    const response = await request.get('/api/cron/variation-notifications');

    expect(response.status()).toBe(401);
  });

  test('sweep endpoint rejects a wrong bearer secret', async ({ request }) => {
    const response = await request.get('/api/cron/variation-notifications', {
      headers: { authorization: 'Bearer wrong-secret' },
    });

    expect(response.status()).toBe(401);
  });
});
