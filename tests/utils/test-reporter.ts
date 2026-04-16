/**
 * Test Results Reporter
 *
 * Tracks expected vs actual values for currency automation tests
 * Generates detailed pass/fail reports
 */

import { PrismaClient } from '@prisma/client'

interface TestResult {
  testName: string
  field: string
  expected: any
  actual: any
  passed: boolean
  difference?: number
}

interface TestSuite {
  suiteName: string
  totalTests: number
  passed: number
  failed: number
  results: TestResult[]
}

class TestReporter {
  private suites: TestSuite[] = []
  private currentSuite: TestSuite | null = null

  startSuite(suiteName: string) {
    this.currentSuite = {
      suiteName,
      totalTests: 0,
      passed: 0,
      failed: 0,
      results: []
    }
    console.log(`\n${'='.repeat(80)}`)
    console.log(`🧪 Test Suite: ${suiteName}`)
    console.log(`${'='.repeat(80)}\n`)
  }

  addResult(testName: string, field: string, expected: any, actual: any) {
    if (!this.currentSuite) {
      throw new Error('No active test suite. Call startSuite() first.')
    }

    const passed = expected === actual
    const difference = typeof expected === 'number' && typeof actual === 'number'
      ? actual - expected
      : undefined

    const result: TestResult = {
      testName,
      field,
      expected,
      actual,
      passed,
      difference
    }

    this.currentSuite.results.push(result)
    this.currentSuite.totalTests++

    if (passed) {
      this.currentSuite.passed++
    } else {
      this.currentSuite.failed++
    }

    // Print immediate result
    const status = passed ? '✅' : '❌'
    console.log(`${status} ${testName} - ${field}`)
    console.log(`   Expected: ${JSON.stringify(expected)}`)
    console.log(`   Actual: ${JSON.stringify(actual)}`)
    if (difference !== undefined) {
      console.log(`   Difference: ${difference}`)
    }
    console.log()
  }

  endSuite() {
    if (!this.currentSuite) return

    this.suites.push(this.currentSuite)

    console.log(`\n${'─'.repeat(80)}`)
    console.log(`📊 Suite Results: ${this.currentSuite.suiteName}`)
    console.log(`${'─'.repeat(80)}`)
    console.log(`Total Tests: ${this.currentSuite.totalTests}`)
    console.log(`✅ Passed: ${this.currentSuite.passed}`)
    console.log(`❌ Failed: ${this.currentSuite.failed}`)
    console.log(`Pass Rate: ${((this.currentSuite.passed / this.currentSuite.totalTests) * 100).toFixed(1)}%`)
    console.log(`${'='.repeat(80)}\n`)

    this.currentSuite = null
  }

  generateReport() {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`🎯 AUTOMATION TEST SUMMARY`)
    console.log(`${'='.repeat(80)}\n`)

    let totalTests = 0
    let totalPassed = 0
    let totalFailed = 0

    for (const suite of this.suites) {
      totalTests += suite.totalTests
      totalPassed += suite.passed
      totalFailed += suite.failed
    }

    console.log(`📈 Overall Statistics:`)
    console.log(`   Total Test Suites: ${this.suites.length}`)
    console.log(`   Total Test Cases: ${totalTests}`)
    console.log(`   ✅ Passed: ${totalPassed}`)
    console.log(`   ❌ Failed: ${totalFailed}`)
    console.log(`   Pass Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%\n`)

    // Print failed tests summary
    if (totalFailed > 0) {
      console.log(`❌ Failed Tests Summary:\n`)
      for (const suite of this.suites) {
        const failed = suite.results.filter(r => !r.passed)
        if (failed.length > 0) {
          console.log(`Suite: ${suite.suiteName}`)
          for (const result of failed) {
            console.log(`  ❌ ${result.testName} - ${result.field}`)
            console.log(`     Expected: ${result.expected}`)
            console.log(`     Actual: ${result.actual}`)
            if (result.difference !== undefined) {
              console.log(`     Difference: ${result.difference}`)
            }
          }
          console.log()
        }
      }
    }

    console.log(`${'='.repeat(80)}\n`)

    if (totalFailed === 0) {
      console.log(`🎉 ALL TESTS PASSED!`)
      console.log(`✅ Ready for manual testing with TESTING_CHECKLIST.md`)
      console.log(`\nNext Steps:`)
      console.log(`1. Manual verification (30 min)`)
      console.log(`2. Document results with screenshots`)
      console.log(`3. Deploy to production\n`)
    } else {
      console.log(`⚠️  ${totalFailed} TEST(S) FAILED`)
      console.log(`❌ Fix bugs before manual testing`)
      console.log(`\nAction Items:`)
      console.log(`1. Review failed tests above`)
      console.log(`2. Identify root cause (double-division? wrong conversion?)`)
      console.log(`3. Fix bugs in code`)
      console.log(`4. Re-run automation tests`)
      console.log(`5. Repeat until 100% pass rate\n`)
    }

    return {
      totalTests,
      totalPassed,
      totalFailed,
      passRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0,
      passed: totalFailed === 0
    }
  }
}

// Export for use in test files
export { TestReporter }
