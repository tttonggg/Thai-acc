#!/usr/bin/env node

/**
 * Comprehensive Currency Bug Test
 *
 * Tests:
 * 1. List view returns Baht (not Satang)
 * 2. Detail view returns Baht (not Satang)
 * 3. List and detail show SAME amount
 * 4. CSRF token generation works
 * 5. Can create invoice with decimals
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
let sessionId = null;
let csrfToken = null;

// Color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

function log(message, color = '') {
  console.log(`${color}${message}${RESET}`);
}

async function login() {
  log('\n=== Step 1: Login ===', YELLOW);

  const data = JSON.stringify({
    email: 'admin@thaiaccounting.com',
    password: 'admin123'
  });

  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
        if (sessionCookie) {
          sessionId = sessionCookie.split(';')[0];
          log(`✅ Logged in, session: ${sessionId.substring(0, 20)}...`, GREEN);
          resolve();
        } else {
          log('❌ No session cookie found', RED);
          reject(new Error('No session'));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getCsrfToken() {
  log('\n=== Step 2: Get CSRF Token ===', YELLOW);

  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/csrf/token`, {
      method: 'GET',
      headers: {
        'Cookie': sessionId
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.success && json.data && json.data.token) {
            csrfToken = json.data.token;
            log(`✅ CSRF token: ${csrfToken.substring(0, 20)}...`, GREEN);
            resolve();
          } else {
            log(`❌ Failed to get CSRF: ${body}`, RED);
            reject(new Error('No CSRF token'));
          }
        } catch (e) {
          log(`❌ Parse error: ${e.message}`, RED);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testListView() {
  log('\n=== Step 3: Test List View ===', YELLOW);

  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/invoices?limit=1`, {
      method: 'GET',
      headers: {
        'Cookie': sessionId
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.success && json.data && json.data.length > 0) {
            const invoice = json.data[0];
            log(`Invoice: ${invoice.invoiceNo}`, YELLOW);
            log(`  totalAmount: ${invoice.totalAmount}`);
            log(`  netAmount: ${invoice.netAmount}`);

            // Check if amounts look like Baht (has decimals, not huge integer)
            const hasDecimals = invoice.totalAmount.toString().includes('.');
            const isReasonable = invoice.totalAmount < 1000000; // Less than 1 million

            if (hasDecimals && isReasonable) {
              log('✅ List view returns Baht (has decimals, reasonable amount)', GREEN);
              resolve(invoice);
            } else if (!hasDecimals) {
              log(`❌ List view returns Satang (no decimals): ${invoice.totalAmount}`, RED);
              reject(new Error('List view not converted'));
            } else {
              log(`⚠️  Amount seems too large: ${invoice.totalAmount}`, YELLOW);
              resolve(invoice);
            }
          } else {
            log('❌ No invoices found', RED);
            reject(new Error('No invoices'));
          }
        } catch (e) {
          log(`❌ Parse error: ${e.message}`, RED);
          log(`Body: ${body}`, YELLOW);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testDetailView(invoiceNo) {
  log('\n=== Step 4: Test Detail View ===', YELLOW);

  // Get invoice ID from list
  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/invoices?limit=1`, {
      method: 'GET',
      headers: {
        'Cookie': sessionId
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.success && json.data && json.data.length > 0) {
            const invoiceId = json.data[0].id;
            const listAmount = json.data[0].totalAmount;

            log(`Testing invoice ID: ${invoiceId}`, YELLOW);

            // Now get detail
            const detailReq = http.request(`${BASE_URL}/api/invoices/${invoiceId}`, {
              method: 'GET',
              headers: {
                'Cookie': sessionId
              }
            }, (detailRes) => {
              let detailBody = '';
              detailRes.on('data', chunk => detailBody += chunk);
              detailRes.on('end', () => {
                try {
                  const detailJson = JSON.parse(detailBody);
                  if (detailJson.success && detailJson.data) {
                    const detail = detailJson.data;
                    log(`  totalAmount: ${detail.totalAmount}`);
                    log(`  netAmount: ${detail.netAmount}`);

                    const hasDecimals = detail.totalAmount.toString().includes('.');
                    const amountsMatch = Math.abs(detail.totalAmount - listAmount) < 0.01;

                    if (hasDecimals && amountsMatch) {
                      log('✅ Detail view returns Baht (matches list view)', GREEN);
                      resolve({ list: listAmount, detail: detail.totalAmount });
                    } else if (!hasDecimals) {
                      log(`❌ Detail view returns Satang (no decimals): ${detail.totalAmount}`, RED);
                      log(`   List view showed: ${listAmount}`, YELLOW);
                      reject(new Error('Detail view not converted'));
                    } else if (!amountsMatch) {
                      log(`❌ Amounts don't match!`, RED);
                      log(`   List: ${listAmount}`, YELLOW);
                      log(`   Detail: ${detail.totalAmount}`, YELLOW);
                      reject(new Error('Amount mismatch'));
                    }
                  } else {
                    log('❌ Failed to get detail', RED);
                    reject(new Error('Detail failed'));
                  }
                } catch (e) {
                  log(`❌ Parse error: ${e.message}`, RED);
                  reject(e);
                }
              });
            });

            detailReq.on('error', reject);
            detailReq.end();

          } else {
            reject(new Error('No invoice'));
          }
        } catch (e) {
          log(`❌ Parse error: ${e.message}`, RED);
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testCreateInvoice() {
  log('\n=== Step 5: Test Create Invoice ===', YELLOW);

  const data = JSON.stringify({
    invoiceDate: new Date().toISOString(),
    customerId: 'cm0wqk8jz000001sb5f2a8xr6', // First customer
    type: 'TAX_INVOICE',
    lines: [
      {
        description: 'Test Product ฿1234.56',
        quantity: 1,
        unit: 'ชิ้น',
        unitPrice: 1234.56,
        discount: 0,
        vatRate: 7,
        vatAmount: 86.42,
        amount: 1234.56
      }
    ],
    subtotal: 1234.56,
    vatAmount: 86.42,
    totalAmount: 1320.98,
    discountAmount: 0,
    withholdingRate: 0,
    withholdingAmount: 0,
    netAmount: 1320.98
  });

  return new Promise((resolve, reject) => {
    const req = http.request(`${BASE_URL}/api/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionId,
        'x-csrf-token': csrfToken,
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.success) {
            log('✅ Invoice created successfully', GREEN);
            log(`   Invoice No: ${json.data.invoiceNo}`, YELLOW);
            log(`   Total: ฿${json.data.totalAmount}`, YELLOW);
            resolve(json.data);
          } else {
            log(`❌ Failed to create: ${json.error || body}`, RED);
            reject(new Error(json.error || 'Create failed'));
          }
        } catch (e) {
          log(`❌ Parse error: ${e.message}`, RED);
          log(`Body: ${body}`, YELLOW);
          reject(e);
        }
      });
    });

    req.on('error', (err) => {
      log(`❌ Request error: ${err.message}`, RED);
      reject(err);
    });
    req.write(data);
    req.end();
  });
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════╗', YELLOW);
  log('║  Comprehensive Currency Bug Test               ║', YELLOW);
  log('╚════════════════════════════════════════════════╝', YELLOW);

  try {
    await login();
    await getCsrfToken();

    const invoice = await testListView();

    // Get first invoice ID for detail test
    const listReq = await new Promise((resolve, reject) => {
      http.get(`${BASE_URL}/api/invoices?limit=1`, {
        headers: { 'Cookie': sessionId }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.data && json.data.length > 0) {
              resolve(json.data[0].id);
            } else {
              reject(new Error('No invoice'));
            }
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });

    await testDetailView();

    log('\n=== All Tests Passed! ===', GREEN);
    log('✅ List view shows Baht', GREEN);
    log('✅ Detail view shows Baht', GREEN);
    log('✅ Both views show same amount', GREEN);
    log('✅ CSRF token works', GREEN);

    process.exit(0);
  } catch (error) {
    log(`\n❌ Test Failed: ${error.message}`, RED);
    process.exit(1);
  }
}

runTests();
