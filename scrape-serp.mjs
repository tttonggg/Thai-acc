import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const SEARCH_QUERY = 'โปรแกรมบัญชีออนไลน์ Thailand';
const OUTPUT_FILE = '/users/tong/Desktop/Thai-acc-sandbox/serp-results.json';

async function scrapeSerp() {
  const browser = await chromium.launch({ 
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
  });
  
  const page = await context.newPage();
  
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  console.log('--- Google SERP Scraping ---\n');
  
  try {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(SEARCH_QUERY)}&hl=th&gl=th`;
    await page.goto(searchUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(5000);
    
    // Extract using h3 as primary selector
    const results = await page.evaluate(() => {
      const organicResults = [];
      const seenUrls = new Set();
      
      const h3Elements = document.querySelectorAll('h3');
      
      h3Elements.forEach((h3, index) => {
        if (index >= 10) return;
        
        const parent = h3.closest('div[data-hveid], div.g, div[data-snc]');
        const linkEl = parent?.querySelector('a[href]') || h3.querySelector('a');
        
        let snippet = '';
        const snippetEl = parent?.querySelector('.VwiC3b, .IsZvec, .st, span[data-ved]');
        if (snippetEl) {
          snippet = snippetEl.textContent?.trim() || '';
        }
        
        let url = '';
        if (linkEl && linkEl.href) {
          url = linkEl.href;
        } else {
          const parentLink = parent?.querySelector('a');
          if (parentLink) url = parentLink.href;
        }
        
        // Skip Google internal links and duplicates
        if (url && !url.includes('google.com') && !url.includes('google.co.th') && 
            url.startsWith('http') && !seenUrls.has(url)) {
          seenUrls.add(url);
          organicResults.push({
            position: organicResults.length + 1,
            title: h3.textContent?.trim() || '',
            url: url,
            snippet: snippet
          });
        }
      });
      
      return organicResults;
    });
    
    // Build raw SERP data object
    const rawSerpData = {
      searchQuery: SEARCH_QUERY,
      searchEngine: 'Google',
      timestamp: new Date().toISOString(),
      totalResults: results.length,
      results: results
    };
    
    console.log(`=== RAW SERP DATA ===`);
    console.log(`Query: "${SEARCH_QUERY}"`);
    console.log(`Search Engine: Google`);
    console.log(`Timestamp: ${rawSerpData.timestamp}`);
    console.log(`Total Organic Results: ${results.length}\n`);
    
    console.log('--- Top 10 Organic Results ---\n');
    results.forEach((r) => {
      console.log(`[${r.position}] Title: ${r.title}`);
      console.log(`    URL: ${r.url}`);
      console.log(`    Snippet: ${r.snippet.substring(0, 200)}${r.snippet.length > 200 ? '...' : ''}`);
      console.log('');
    });
    
    // Save raw JSON
    writeFileSync(OUTPUT_FILE, JSON.stringify(rawSerpData, null, 2));
    console.log(`\nRaw SERP data saved to: ${OUTPUT_FILE}`);
    
    await browser.close();
    return rawSerpData;
    
  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
    return null;
  }
}

scrapeSerp().then(results => {
  console.log('\n=== TASK COMPLETE ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});