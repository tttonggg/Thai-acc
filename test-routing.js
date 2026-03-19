#!/usr/bin/env node
// Simple test script to verify routing works

const http = require('http');

const TEST_URLS = [
  '/',
  '/warehouses',
  '/employees',
  '/inventory',
  '/payroll',
];

function testUrl(path) {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3000' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasRedirect = data.includes('dashboard') && path !== '/';
        const status = res.statusCode;
        resolve({
          path,
          status,
          ok: status === 200 && !hasRedirect,
          size: data.length
        });
      });
    });
    req.on('error', (err) => {
      resolve({ path, status: 0, ok: false, error: err.message });
    });
    req.setTimeout(5000, () => {
      req.abort();
      resolve({ path, status: 0, ok: false, error: 'timeout' });
    });
  });
}

async function main() {
  console.log('🧪 Testing URL Routing...\n');
  
  for (const url of TEST_URLS) {
    const result = await testUrl(url);
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${url.padEnd(20)} Status: ${result.status}, Size: ${result.size} bytes`);
  }
}

main();
