#!/usr/bin/env ts-node
/**
 * Playwright Test Report Generator
 *
 * Generates comprehensive HTML reports from Playwright test results
 * including:
 * - Test execution summary
 * - Pass/fail statistics
 * - Screenshots and artifacts
 * - Database verification results
 * - Timing information
 * - Error details and stack traces
 */

import fs from 'fs';
import path from 'path';

interface TestResult {
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  errors: Array<{
    message: string;
    stack?: string;
  }>;
  attachments: Array<{
    name: string;
    path: string;
    contentType: string;
  }>;
}

interface TestSuite {
  title: string;
  tests: TestResult[];
  duration: number;
}

interface ReportData {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  suites: TestSuite[];
  artifacts: {
    screenshots: number;
    videos: number;
    traces: number;
  };
}

/**
 * Parse Playwright JSON results
 */
function parseTestResults(resultsPath: string): ReportData {
  const resultsJson = fs.readFileSync(resultsPath, 'utf-8');
  const results = JSON.parse(resultsJson);

  const reportData: ReportData = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    suites: [],
    artifacts: {
      screenshots: 0,
      videos: 0,
      traces: 0
    }
  };

  // Process test files
  for (const file of results.files || []) {
    const suite: TestSuite = {
      title: path.basename(file.location.file),
      tests: [],
      duration: 0
    };

    for (const test of file.tests || []) {
      const testResult: TestResult = {
        status: test.results?.[0]?.status || 'skipped',
        duration: test.results?.[0]?.duration || 0,
        errors: test.results?.[0]?.errors || [],
        attachments: []
      };

      suite.tests.push(testResult);
      suite.duration += testResult.duration;
      reportData.totalTests++;

      switch (testResult.status) {
        case 'passed':
          reportData.passed++;
          break;
        case 'failed':
          reportData.failed++;
          break;
        case 'skipped':
          reportData.skipped++;
          break;
      }
    }

    reportData.suites.push(suite);
    reportData.duration += suite.duration;
  }

  return reportData;
}

/**
 * Scan for artifacts
 */
function scanArtifacts(testResultsDir: string): { screenshots: number; videos: number; traces: number } {
  const artifacts = { screenshots: 0, videos: 0, traces: 0 };

  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        if (file.endsWith('.png')) artifacts.screenshots++;
        if (file.endsWith('.webm')) artifacts.videos++;
        if (file.endsWith('.zip')) artifacts.traces++;
      }
    }
  };

  scanDir(testResultsDir);
  return artifacts;
}

/**
 * Generate HTML report
 */
function generateHTMLReport(data: ReportData, outputPath: string): void {
  const passRate = data.totalTests > 0 ? ((data.passed / data.totalTests) * 100).toFixed(1) : '0';
  const avgDuration = data.totalTests > 0 ? (data.duration / data.totalTests).toFixed(0) : '0';

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thai Accounting ERP - E2E Test Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .header h1 { font-size: 2.5em; margin-bottom: 10px; }
    .header p { opacity: 0.9; font-size: 1.1em; }
    .timestamp { font-size: 0.9em; opacity: 0.8; margin-top: 10px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }
    .summary-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s;
    }
    .summary-card:hover { transform: translateY(-4px); }
    .summary-card h3 {
      font-size: 0.9em;
      color: #6c757d;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-card .value {
      font-size: 2.5em;
      font-weight: bold;
      margin-bottom: 8px;
    }
    .summary-card.total .value { color: #667eea; }
    .summary-card.passed .value { color: #28a745; }
    .summary-card.failed .value { color: #dc3545; }
    .summary-card.skipped .value { color: #ffc107; }
    .summary-card.pass-rate .value { color: #17a2b8; }
    .artifacts {
      padding: 20px 40px;
      background: white;
      border-top: 1px solid #e9ecef;
    }
    .artifacts h2 {
      margin-bottom: 20px;
      color: #495057;
    }
    .artifacts-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .artifact-item {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
      text-align: center;
    }
    .artifact-item .icon { font-size: 2em; margin-bottom: 8px; }
    .artifact-item .count { font-size: 1.5em; font-weight: bold; }
    .suites {
      padding: 40px;
    }
    .suites h2 {
      margin-bottom: 24px;
      color: #495057;
    }
    .suite {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .suite-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #dee2e6;
    }
    .suite-title { font-size: 1.2em; font-weight: 600; }
    .suite-duration { color: #6c757d; }
    .test-list { list-style: none; }
    .test-item {
      padding: 12px;
      margin: 8px 0;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-item.passed { background: #d4edda; border-left: 4px solid #28a745; }
    .test-item.failed { background: #f8d7da; border-left: 4px solid #dc3545; }
    .test-item.skipped { background: #fff3cd; border-left: 4px solid #ffc107; }
    .test-name { font-weight: 500; }
    .test-duration { color: #6c757d; font-size: 0.9em; }
    .footer {
      background: #f8f9fa;
      padding: 24px;
      text-align: center;
      color: #6c757d;
      font-size: 0.9em;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85em;
      font-weight: 600;
      margin-left: 8px;
    }
    .badge.passed { background: #28a745; color: white; }
    .badge.failed { background: #dc3545; color: white; }
    .badge.skipped { background: #ffc107; color: #212529; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🐘 Thai Accounting ERP</h1>
      <p>E2E Test Execution Report</p>
      <div class="timestamp">Generated: ${new Date(data.timestamp).toLocaleString('th-TH')}</div>
    </div>

    <div class="summary">
      <div class="summary-card total">
        <h3>Total Tests</h3>
        <div class="value">${data.totalTests}</div>
        <div>tests executed</div>
      </div>
      <div class="summary-card passed">
        <h3>Passed</h3>
        <div class="value">${data.passed}</div>
        <div>tests passed</div>
      </div>
      <div class="summary-card failed">
        <h3>Failed</h3>
        <div class="value">${data.failed}</div>
        <div>tests failed</div>
      </div>
      <div class="summary-card skipped">
        <h3>Skipped</h3>
        <div class="value">${data.skipped}</div>
        <div>tests skipped</div>
      </div>
      <div class="summary-card pass-rate">
        <h3>Pass Rate</h3>
        <div class="value">${passRate}%</div>
        <div>success rate</div>
      </div>
    </div>

    <div class="artifacts">
      <h2>📦 Test Artifacts</h2>
      <div class="artifacts-grid">
        <div class="artifact-item">
          <div class="icon">📸</div>
          <div class="count">${data.artifacts.screenshots}</div>
          <div>Screenshots</div>
        </div>
        <div class="artifact-item">
          <div class="icon">🎥</div>
          <div class="count">${data.artifacts.videos}</div>
          <div>Videos</div>
        </div>
        <div class="artifact-item">
          <div class="icon">🔍</div>
          <div class="count">${data.artifacts.traces}</div>
          <div>Traces</div>
        </div>
      </div>
    </div>

    <div class="suites">
      <h2>📋 Test Suites</h2>
      ${data.suites.map(suite => `
        <div class="suite">
          <div class="suite-header">
            <div class="suite-title">${suite.title}</div>
            <div class="suite-duration">⏱️ ${Math.round(suite.duration / 1000)}s</div>
          </div>
          <ul class="test-list">
            ${suite.tests.map(test => `
              <li class="test-item ${test.status}">
                <span class="test-name">${test.status === 'failed' ? '❌' : test.status === 'skipped' ? '⏭️' : '✅'} Test</span>
                <span class="test-duration">${Math.round(test.duration)}ms</span>
              </li>
            `).join('')}
          </ul>
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Thai Accounting ERP E2E Test Report</p>
      <p>Generated by Playwright Test Runner • ${new Date().getFullYear()}</p>
    </div>
  </div>
</body>
</html>`;

  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✅ HTML report generated: ${outputPath}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n========================================');
  console.log('📊 Generating Playwright Test Report');
  console.log('========================================\n');

  const testResultsDir = path.join(process.cwd(), 'test-results');
  const jsonResultsPath = path.join(testResultsDir, 'results.json');
  const htmlReportPath = path.join(testResultsDir, 'report.html');
  const jsonReportPath = path.join(testResultsDir, 'playwright-report.json');

  // Check if results exist
  if (!fs.existsSync(jsonResultsPath)) {
    console.error('❌ Test results not found. Run tests first.');
    process.exit(1);
  }

  // Parse results
  console.log('📖 Parsing test results...');
  const reportData = parseTestResults(jsonResultsPath);

  // Scan artifacts
  console.log('📦 Scanning artifacts...');
  reportData.artifacts = scanArtifacts(testResultsDir);

  // Generate reports
  console.log('📄 Generating reports...');
  generateHTMLReport(reportData, htmlReportPath);
  fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`✅ JSON report generated: ${jsonReportPath}`);

  // Print summary
  console.log('\n========================================');
  console.log('📊 Test Report Summary');
  console.log('========================================');
  console.log(`Total Tests: ${reportData.totalTests}`);
  console.log(`✅ Passed: ${reportData.passed}`);
  console.log(`❌ Failed: ${reportData.failed}`);
  console.log(`⏭️  Skipped: ${reportData.skipped}`);
  console.log(`📈 Pass Rate: ${((reportData.passed / reportData.totalTests) * 100).toFixed(1)}%`);
  console.log(`⏱️  Duration: ${Math.round(reportData.duration / 1000)}s`);
  console.log('\n📦 Artifacts:');
  console.log(`  📸 Screenshots: ${reportData.artifacts.screenshots}`);
  console.log(`  🎥 Videos: ${reportData.artifacts.videos}`);
  console.log(`  🔍 Traces: ${reportData.artifacts.traces}`);
  console.log('\n========================================\n');

  console.log(`✅ Report generation complete!`);
  console.log(`📄 HTML: ${htmlReportPath}`);
  console.log(`📄 JSON: ${jsonReportPath}\n`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { parseTestResults, generateHTMLReport };
