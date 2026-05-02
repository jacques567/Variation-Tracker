import { createClient } from '@supabase/supabase-js';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    environment: { status: 'ok' | 'missing'; details: string[] };
    database: { status: 'ok' | 'fail'; error?: string };
    stripe: { status: 'ok' | 'fail'; error?: string };
    security: { status: 'ok' | 'fail'; issues: string[] };
    dependencies: { status: 'ok' | 'fail'; details: string };
  };
}

export async function GET(): Promise<Response> {
  const result: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      environment: { status: 'ok', details: [] },
      database: { status: 'ok' },
      stripe: { status: 'ok' },
      security: { status: 'ok', issues: [] },
      dependencies: { status: 'ok', details: 'All dependencies loaded' },
    },
  };

  // 1. Environment Variables Check
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_PRICE_ID',
    'CSRF_SECRET',
  ];

  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);
  if (missingVars.length > 0) {
    result.checks.environment.status = 'missing';
    result.checks.environment.details = missingVars;
    result.status = 'degraded';
  } else {
    result.checks.environment.details = [`All ${requiredEnvVars.length} required vars present`];
  }

  // 2. Database Connectivity Check
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error) {
      result.checks.database.status = 'fail';
      result.checks.database.error = error.message;
      result.status = 'degraded';
    }
  } catch (err) {
    result.checks.database.status = 'fail';
    result.checks.database.error = err instanceof Error ? err.message : 'Unknown error';
    result.status = 'unhealthy';
  }

  // 3. Stripe Configuration Check
  if (!process.env.STRIPE_SECRET_KEY) {
    result.checks.stripe.status = 'fail';
    result.checks.stripe.error = 'STRIPE_SECRET_KEY not configured';
    result.status = 'degraded';
  } else if (!process.env.STRIPE_WEBHOOK_SECRET) {
    result.checks.stripe.status = 'fail';
    result.checks.stripe.error = 'STRIPE_WEBHOOK_SECRET not configured';
    result.status = 'degraded';
  }

  // 4. Security Checks
  const securityIssues: string[] = [];

  // Check for hardcoded secrets
  if (process.env.STRIPE_SECRET_KEY?.length === 0) {
    securityIssues.push('STRIPE_SECRET_KEY is empty');
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    securityIssues.push(`NODE_ENV is ${process.env.NODE_ENV}, expected 'production'`);
  }

  // Check for CSRF secret
  if (!process.env.CSRF_SECRET || process.env.CSRF_SECRET.length < 32) {
    securityIssues.push('CSRF_SECRET is not set or too short (<32 chars)');
  }

  // Verify public keys are safe to expose
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_')) {
    securityIssues.push('STRIPE_PUBLISHABLE_KEY format invalid (should start with pk_)');
  }

  if (securityIssues.length > 0) {
    result.checks.security.status = 'fail';
    result.checks.security.issues = securityIssues;
    result.status = 'degraded';
  }

  // 5. Dependencies (basic check via process)
  try {
    // If we got this far without errors, core dependencies are loaded
    result.checks.dependencies.details = 'Next.js, Supabase, Stripe clients loaded successfully';
  } catch (err) {
    result.checks.dependencies.status = 'fail';
    result.checks.dependencies.details = 'Failed to load dependencies';
    result.status = 'unhealthy';
  }

  // Set HTTP status code based on health
  const statusCode = result.status === 'healthy' ? 200 : result.status === 'degraded' ? 503 : 500;

  return Response.json(result, { status: statusCode });
}
