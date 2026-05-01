/**
 * Performance E2E Tests
 * Tests for Lighthouse CI integration and performance budgets
 */

import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';

// Performance budgets
const PERFORMANCE_BUDGETS = {
  performance: 90,
  accessibility: 100,
  'best-practices': 90,
  seo: 90,
  pwa: 80,
};

// Resource budgets
const RESOURCE_BUDGETS = {
  'total-byte-weight': 2000000, // 2MB
  'dom-size': 1500,
  'resource-summary': {
    script: 50, // Max 50 JS files
    stylesheet: 10, // Max 10 CSS files
    image: 50, // Max 50 images
    font: 10, // Max 10 fonts
  },
};

test.describe('Performance Tests - Login Page', () => {
  test('login page meets performance budget', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return {
        // @ts-ignore
        lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
        // @ts-ignore
        fid:
          performance.getEntriesByType('first-input')[0]?.processingStart -
          performance.getEntriesByType('first-input')[0]?.startTime,
        // @ts-ignore
        cls: performance
          .getEntriesByType('layout-shift')
          .reduce((sum, entry) => sum + entry.value, 0),
        // @ts-ignore
        fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
        // @ts-ignore
        ttfb: performance.getEntriesByType('navigation')[0]?.responseStart,
      };
    });

    // Log metrics for debugging
    console.log('Performance metrics:', metrics);

    // Check budgets
    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500); // LCP < 2.5s
    }
    if (metrics.fid) {
      expect(metrics.fid).toBeLessThan(100); // FID < 100ms
    }
    if (metrics.cls) {
      expect(metrics.cls).toBeLessThan(0.1); // CLS < 0.1
    }
    if (metrics.fcp) {
      expect(metrics.fcp).toBeLessThan(1800); // FCP < 1.8s
    }
    if (metrics.ttfb) {
      expect(metrics.ttfb).toBeLessThan(600); // TTFB < 600ms
    }
  });

  test('login page loads within time budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    console.log(`Login page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('login page resource size is within budget', async ({ page }) => {
    await page.goto('/login');

    // Get resource sizes
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map((r) => ({
        name: r.name,
        type: (r as any).initiatorType,
        size: (r as any).encodedBodySize || 0,
      }));
    });

    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);
    console.log(`Total resource size: ${totalSize} bytes`);

    expect(totalSize).toBeLessThan(RESOURCE_BUDGETS['total-byte-weight']);
  });
});

test.describe('Performance Tests - Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('dashboard meets performance budget', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const metrics = await page.evaluate(() => {
      return {
        // @ts-ignore
        lcp: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
        // @ts-ignore
        cls: performance
          .getEntriesByType('layout-shift')
          .reduce((sum, entry) => sum + entry.value, 0),
      };
    });

    console.log('Dashboard metrics:', metrics);

    if (metrics.lcp) {
      expect(metrics.lcp).toBeLessThan(2500);
    }
    if (metrics.cls) {
      expect(metrics.cls).toBeLessThan(0.1);
    }
  });

  test('dashboard interactive time is acceptable', async ({ page }) => {
    const start = Date.now();
    await page.goto('/dashboard');
    await page.waitForSelector('button, a, input', { state: 'visible' });
    const timeToInteractive = Date.now() - start;

    console.log(`Time to interactive: ${timeToInteractive}ms`);
    expect(timeToInteractive).toBeLessThan(3500);
  });
});

test.describe('Performance Tests - Invoice List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
  });

  test('invoice list renders efficiently', async ({ page }) => {
    const start = Date.now();
    await page.goto('/invoices');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - start;

    console.log(`Invoice list load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('virtual scrolling performance', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForTimeout(1000);

    // Scroll through list
    const scrollStart = Date.now();
    await page.mouse.wheel(0, 1000);
    await page.waitForTimeout(500);
    const scrollTime = Date.now() - scrollStart;

    console.log(`Scroll performance: ${scrollTime}ms`);
    expect(scrollTime).toBeLessThan(100);
  });
});

test.describe('Performance Tests - Memory Usage', () => {
  test('memory usage stays within limits', async ({ page }) => {
    await page.goto('/login');

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory?.usedJSHeapSize || 0;
    });

    // Navigate through several pages
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    await page.goto('/invoices');
    await page.goto('/accounts');
    await page.goto('/reports');

    // Get final memory
    const finalMemory = await page.evaluate(() => {
      // @ts-ignore
      return performance.memory?.usedJSHeapSize || 0;
    });

    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);

      // Memory increase should be reasonable (< 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
    }
  });
});

test.describe('Performance Tests - API Response Times', () => {
  test('API endpoints respond within budget', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@thaiaccounting.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Test API response times
    const apiEndpoints = ['/api/accounts', '/api/invoices', '/api/journal'];

    for (const endpoint of apiEndpoints) {
      const start = Date.now();
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url, { headers: { 'x-playwright-test': 'true' } });
        return res.status;
      }, endpoint);
      const responseTime = Date.now() - start;

      console.log(`${endpoint}: ${responseTime}ms (status: ${response})`);

      if (response === 200) {
        expect(responseTime).toBeLessThan(1000); // API should respond within 1s
      }
    }
  });
});

test.describe('Performance Tests - Accessibility', () => {
  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');

    // Check for common accessibility issues
    const issues = await page.evaluate(() => {
      const problems = [];

      // Check for images without alt text
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          problems.push(`Image without alt: ${img.src}`);
        }
      });

      // Check for form inputs without labels
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      inputs.forEach((input) => {
        const id = input.id;
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        const hasPlaceholder = input.getAttribute('placeholder');

        if (!hasLabel && !ariaLabel && !ariaLabelledBy && !hasPlaceholder) {
          problems.push(`Input without label: ${input.name || input.type}`);
        }
      });

      // Check for buttons without text
      const buttons = document.querySelectorAll('button');
      buttons.forEach((btn) => {
        if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
          problems.push(`Button without text: ${btn.className}`);
        }
      });

      return problems;
    });

    console.log('Accessibility issues:', issues);
    expect(issues.length).toBe(0);
  });

  test('focus management works correctly', async ({ page }) => {
    await page.goto('/login');

    // Check that focusable elements are visible and accessible
    const focusableElements = await page.locator('button, input, a, select, textarea').all();

    for (const element of focusableElements) {
      await element.focus();
      const isFocused = await element.evaluate((el) => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });
});

test.describe('Performance Tests - SEO', () => {
  test('page has proper meta tags', async ({ page }) => {
    await page.goto('/login');

    // Check title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title.length).toBeLessThan(60);

    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    if (description) {
      expect(description.length).toBeGreaterThan(0);
      expect(description.length).toBeLessThan(160);
    }

    // Check viewport
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('page has proper heading structure', async ({ page }) => {
    await page.goto('/login');

    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1); // Should have exactly one h1

    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;

    for (const heading of headings) {
      const level = parseInt(await heading.evaluate((el) => el.tagName)[1]);
      expect(level).toBeGreaterThanOrEqual(previousLevel);
      expect(level).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = level;
    }
  });
});

test.describe('Performance Budget Enforcement', () => {
  test('enforces JavaScript bundle size', async ({ page }) => {
    const jsResources: { name: string; size: number }[] = [];

    page.on('response', async (response) => {
      const contentType = response.headers()['content-type'];
      if (contentType?.includes('javascript')) {
        const body = await response.body();
        jsResources.push({
          name: response.url(),
          size: body.length,
        });
      }
    });

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const totalJsSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    console.log(`Total JS size: ${totalJsSize / 1024}KB`);

    // Total JS should be less than 500KB
    expect(totalJsSize).toBeLessThan(500 * 1024);
  });

  test('enforces image optimization', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const images = await page.locator('img').all();

    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        // Check if image has width/height attributes
        const width = await img.getAttribute('width');
        const height = await img.getAttribute('height');

        // Images should have dimensions to prevent layout shift
        expect(width || height).toBeTruthy();
      }
    }
  });
});
