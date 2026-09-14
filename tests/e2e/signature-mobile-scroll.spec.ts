import { test, expect, devices } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

/**
 * Regression guard for commit 3775adc ("fix: prevent mobile signature wipe
 * on scroll"). react-signature-canvas clears on window `resize`, and mobile
 * Safari/Chrome fire `resize` when the address bar collapses/expands during
 * scroll — which was wiping an in-progress signature before submit. The fix
 * was `clearOnResize={false}` in SignatureForm.tsx; this test exists so a
 * future refactor that drops that prop (or swaps the canvas lib) fails CI
 * instead of shipping the regression silently.
 *
 * Seeds a real contractor/job/variation via the service role so the sign
 * page renders the live form rather than a 404/expired state, then cleans
 * up everything it created.
 */

test.describe.configure({ mode: 'serial' });

let supabase: any = null;
let contractorId: string | null = null;
let jobId: string | null = null;
let variationId: string | null = null;
let signatureToken: string | null = null;

const skipReason = 'Missing Supabase service role credentials — skipping mobile scroll regression test.';

test.beforeAll(async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return;

  // Untyped client: this file only seeds/tears down disposable QA rows, it
  // doesn't need the generated Database types the app code uses.
  supabase = createClient(url, serviceRoleKey) as any;

  const email = `mobile-scroll-qa-${crypto.randomUUID()}@example.com`;
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: { full_name: 'QA Mobile Scroll Test' },
  });
  if (userError || !userData.user) throw new Error(`Failed to seed test contractor: ${userError?.message}`);
  contractorId = userData.user.id;

  // No separate insert into `contractors` here: the on_auth_user_created
  // trigger (001_initial_schema.sql) already inserts that row from
  // auth.users, reading full_name out of user_metadata above. A second
  // explicit insert with the same id hit contractors_pkey every time.

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      contractor_id: contractorId,
      client_name: 'QA Client',
      client_email: 'qa-client@example.com',
      job_name: 'Mobile scroll regression job',
      address: '1 Test Street',
      original_value: 100000,
    })
    .select('id')
    .single();
  if (jobError || !job) throw new Error(`Failed to seed job: ${jobError?.message}`);
  jobId = job.id;

  const { data: variation, error: variationError } = await supabase
    .from('variations')
    .insert({
      job_id: jobId,
      description: 'Extra groundworks',
      cost: 25000,
      status: 'pending',
    })
    .select('id, signature_token')
    .single();
  if (variationError || !variation) throw new Error(`Failed to seed variation: ${variationError?.message}`);
  variationId = variation.id;
  signatureToken = variation.signature_token;
});

test.afterAll(async () => {
  if (!supabase) return;
  if (variationId) await supabase.from('variations').delete().eq('id', variationId);
  if (jobId) await supabase.from('jobs').delete().eq('id', jobId);
  if (contractorId) await supabase.auth.admin.deleteUser(contractorId);
});

// Only the mobile viewport/touch/UA fields, not the whole iPhone 13 preset:
// that preset also sets defaultBrowserType: 'webkit', which this repo's
// playwright.config.ts doesn't install (only chromium/firefox projects are
// configured) and CI has no webkit binary cached, so it fails to launch.
// isMobile is also skipped — Firefox's newContext rejects it outright, and
// viewport + hasTouch are what actually exercise the touch-drag + resize path.
const iPhone13 = devices['iPhone 13'];
test.use({
  viewport: iPhone13.viewport,
  userAgent: iPhone13.userAgent,
  hasTouch: iPhone13.hasTouch,
});

test('signature survives an address-bar resize event mid-scroll', async ({ page }) => {
  test.skip(!supabase || !signatureToken, skipReason);

  await page.goto(`/sign/${signatureToken}`);

  // Wait for initial network activity to settle — specifically the CSRF token
  // fetch that SignatureForm fires in useEffect. The submit button is
  // disabled={loading || !csrfToken || isEmpty}; if csrfToken hasn't arrived
  // by the time we check the button, the test fails even though isEmpty is
  // correctly set to false after drawing.
  await page.waitForLoadState('networkidle');

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  // The sign page can exceed the iPhone 13 viewport height (844px) when the
  // variation card has multiple fields, pushing the canvas below the fold.
  // Scroll it into view before computing the bounding box; raw touchscreen
  // coordinates are viewport-relative and miss an off-screen canvas silently.
  await canvas.scrollIntoViewIfNeeded();

  if (!await canvas.boundingBox()) throw new Error('Signature canvas has no bounding box');

  // signature_pad registers both touch AND mouse event listeners unconditionally.
  // Synthetic TouchEvent.changedTouches is unreliable across headless browsers —
  // Chromium returns empty changedTouches, Firefox crashes the library's internal
  // data array. MouseEvent avoids all of that: clientX/clientY are first-class
  // constructor args, no TouchList involved. The mouseup listener is on document,
  // so bubbling from the canvas is enough to reach it.
  await canvas.evaluate((el: HTMLCanvasElement) => {
    const rect = el.getBoundingClientRect();
    const sx = rect.left + rect.width * 0.2;
    const sy = rect.top + rect.height * 0.5;
    const ex = rect.left + rect.width * 0.8;
    const mk = (type: string, x: number, y: number) =>
      new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 });
    el.dispatchEvent(mk('mousedown', sx, sy));
    for (let i = 1; i <= 10; i++) {
      const x = sx + (ex - sx) * (i / 10);
      el.dispatchEvent(mk('mousemove', x, sy));
    }
    el.dispatchEvent(mk('mouseup', ex, sy));
  });
  // Allow React to flush the state update from onBegin before proceeding.
  await page.waitForTimeout(100);

  const dataUrlBeforeResize = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  expect(dataUrlBeforeResize).not.toEqual(await blankCanvasDataUrl(page));

  // Simulate the mobile address-bar collapse: viewport height shrinks and
  // fires `resize`, which is exactly what wiped the signature pre-fix.
  await page.setViewportSize({ width: 390, height: 700 });
  await page.waitForTimeout(100);

  const dataUrlAfterResize = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  expect(dataUrlAfterResize).toEqual(dataUrlBeforeResize);
  expect(dataUrlAfterResize).not.toEqual(await blankCanvasDataUrl(page));

  // The submit button should still be enabled — proof the form's isEmpty
  // state wasn't reset by the resize either.
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
});

test('signature survives an orientation change (width resize)', async ({ page }) => {
  test.skip(!supabase || !signatureToken, skipReason);

  await page.goto(`/sign/${signatureToken}`);
  await page.waitForLoadState('networkidle');

  const canvas = page.locator('canvas').first();
  await expect(canvas).toBeVisible();

  await canvas.scrollIntoViewIfNeeded();

  if (!await canvas.boundingBox()) throw new Error('Signature canvas has no bounding box');

  await canvas.evaluate((el: HTMLCanvasElement) => {
    const rect = el.getBoundingClientRect();
    const sx = rect.left + rect.width * 0.2;
    const sy = rect.top + rect.height * 0.5;
    const ex = rect.left + rect.width * 0.8;
    const mk = (type: string, x: number, y: number) =>
      new MouseEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 });
    el.dispatchEvent(mk('mousedown', sx, sy));
    for (let i = 1; i <= 10; i++) {
      const x = sx + (ex - sx) * (i / 10);
      el.dispatchEvent(mk('mousemove', x, sy));
    }
    el.dispatchEvent(mk('mouseup', ex, sy));
  });
  await page.waitForTimeout(100);

  const blank = await blankCanvasDataUrl(page);
  const dataUrlBeforeRotate = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  expect(dataUrlBeforeRotate).not.toEqual(blank);

  // Portrait -> landscape: a real rotation, not just an address-bar collapse.
  // The canvas's CSS width changes here, unlike the resize test above — this
  // is the case clearOnResize={false} alone does not handle, since it skips
  // the library's resize entirely and leaves the backing buffer stretched
  // into the new box instead of redrawn to fit it.
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(300);

  // The actual glitch this guards against: without a redraw, the canvas's
  // backing pixel buffer (canvas.width/height) stays sized for the old,
  // narrower box while its CSS box grows to fill the new landscape width —
  // the browser then stretches the old raster to fit, warping the signature
  // and throwing off where new strokes land. When the box did grow, the
  // buffer should have been resized to track it.
  const dimensions = await canvas.evaluate((el: HTMLCanvasElement) => ({
    bufferWidth: el.width,
    cssWidth: el.offsetWidth,
  }));
  if (dimensions.cssWidth > 390) {
    const ratio = await page.evaluate(() => window.devicePixelRatio || 1);
    expect(dimensions.bufferWidth).toBeCloseTo(dimensions.cssWidth * ratio, 0);
  }

  const dataUrlAfterRotate = await canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
  expect(dataUrlAfterRotate).not.toEqual(blank);

  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeEnabled();
});

async function blankCanvasDataUrl(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const c = document.createElement('canvas');
    return c.toDataURL();
  });
}
