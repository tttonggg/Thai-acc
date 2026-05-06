#!/usr/bin/env node
/**
 * serp-paa.mjs — Extract People Also Ask (PAA) from Google using Playwright
 * 
 * Usage:
 *   node scripts/serp-paa.mjs "ภาษีมูลค่าเพิ่ม 7%"
 *   SERPER_API_KEY=xxx node scripts/serp-paa.mjs "โปรแกรมบัญชีออนไลน์"
 */

import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── CLI args ─────────────────────────────────────────────────────────────────
const keyword = process.argv[2] || process.argv[3] || 'ภาษีมูลค่าเพิ่ม 7%';
const outputDir = join(ROOT, 'docs/seo-prep/serp-analysis/raw');
const outputFile = join(outputDir, `paa-${Date.now()}.json`);

// ── Config ────────────────────────────────────────────────────────────────────
// Load API key from env or .env file
let serperKey = process.env.SERPER_API_KEY || '';
try {
  const envFile = readFileSync(join(ROOT, '.env'), 'utf8');
  for (const line of envFile.split('\n')) {
    if (line.startsWith('SERPER_API_KEY=')) {
      serperKey = line.split('=')[1].trim().replace(/['"]/g, '');
    }
  }
} catch { /* no .env */ }

const USE_SERPER = !!serperKey;

// ── Helpers ───────────────────────────────────────────────────────────────────
async function fetchWithSerper(query) {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-Key': serperKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, gl: 'th', hl: 'th', num: 10 }),
  });
  return res.json();
}

async function scrapePAAWithPlaywright(query) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      'Accept-Language': 'th-TH,th;q=0.9',
    },
  });
  const page = await context.newPage();

  // Block ads + analytics to speed up
  await page.route('**/*.{doubleclick,googlesyndication,googleadservices}.com/**', r => r.abort());
  await page.route('**/pagead/**', r => r.abort());

  const results = { organic: [], paa: [], knowledgeGraph: null, video: [] };
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.google.com/search?q=${encodedQuery}&hl=th&gl=th`;

  console.log(`  → Navigating to Google: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Extract PAA (People Also Ask)
  const paaSelector = '.wQ82Zd';
  const paaElements = await page.locator(paaSelector).all();
  console.log(`  → Found ${paaElements.length} PAA elements`);

  for (const el of paaElements) {
    const question = await el.locator('.wQ82Zd').first().textContent().catch(() => null);
    if (question) {
      // Expand the PAA to get answer
      try {
        await el.click({ timeout: 3000 });
        await page.waitForTimeout(500);
        const answerEl = await el.locator('.hDrhEe').first();
        const answer = await answerEl.textContent().catch(() => null);
        results.paa.push({ question: question.trim(), answer: answer?.trim() || null });
      } catch {
        results.paa.push({ question: question.trim(), answer: null });
      }
    }
  }

  // Extract organic results
  const organicSelector = 'div.g';
  const organicElements = await page.locator(organicSelector).all();
  console.log(`  → Found ${organicElements.length} organic results`);

  for (const el of organicElements) {
    const titleEl = el.locator('h3').first();
    const linkEl = el.locator('a').first();
    const snippetEl = el.locator('div[data-sncf]').first();
    
    const title = await titleEl.textContent().catch(() => null);
    const link = await linkEl.getAttribute('href').catch(() => null);
    const snippet = await snippetEl.textContent().catch(() => null);
    
    if (title && link) {
      results.organic.push({
        title: title.trim(),
        link,
        snippet: snippet?.trim() || '',
      });
    }
  }

  // Extract video results
  const videoSelector = 'g-scrolling-carousel';
  const videoSection = await page.locator(videoSelector).first();
  if (await videoSection.isVisible().catch(() => false)) {
    const videoCards = await page.locator('div[aria-label*="วิดีโอ"]').all();
    for (const card of videoCards) {
      const title = await card.locator('h3').first().textContent().catch(() => null);
      const link = await card.locator('a').first().getAttribute('href').catch(() => null);
      if (title) {
        results.video.push({ title: title.trim(), link });
      }
    }
  }

  await browser.close();
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(outputDir, { recursive: true });
  
  console.log(`\n🔍 SERP + PAA Scraper`);
  console.log(`   Keyword: ${keyword}`);
  console.log(`   Serper API: ${USE_SERPER ? '✅ enabled' : '❌ disabled'}\n`);

  let data;

  if (USE_SERPER) {
    console.log('📡 Fetching via Serper.dev API...');
    data = await fetchWithSerper(keyword);
    data.paa = []; // Serper doesn't return PAA in this endpoint
    data.source = 'serper-api';
    console.log(`  ✅ Got ${data.organic?.length || 0} organic results`);
  }

  console.log('📡 Scraping PAA via Playwright...');
  const paaData = await scrapePAAWithPlaywright(keyword);
  
  if (!data) data = { organic: [], source: 'playwright' };
  data.paa = paaData.paa || [];
  data.source = USE_SERPER ? 'serper+playwright' : 'playwright-only';
  
  console.log(`  ✅ Got ${data.paa.length} PAA questions`);
  console.log(`  ✅ Got ${paaData.organic?.length || 0} organic from Playwright`);

  // Merge/organic from playwright if serper organic is empty
  if (!data.organic || data.organic.length === 0) {
    data.organic = paaData.organic;
  }

  // Save
  writeFileSync(outputFile, JSON.stringify(data, null, 2, { ensure_ascii: false }));
  console.log(`\n💾 Saved to: ${outputFile}`);

  // Also save latest as alias
  const latestFile = join(outputDir, `paa-latest.json`);
  writeFileSync(latestFile, JSON.stringify(data, null, 2, { ensure_ascii: false }));
  console.log(`💾 Latest:  ${latestFile}`);

  // Print summary
  console.log(`\n📊 Summary:`);
  console.log(`   Organic: ${data.organic?.length || 0}`);
  console.log(`   PAA: ${data.paa?.length || 0}`);
  if (data.paa?.length > 0) {
    console.log(`\n   Top PAA questions:`);
    data.paa.slice(0, 5).forEach((q, i) => {
      console.log(`   ${i + 1}. ${q.question}`);
    });
  }

  return data;
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
