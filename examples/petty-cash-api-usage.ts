/**
 * Petty Cash API Usage Examples
 * Examples of how to use the petty cash voucher APIs
 */

// ============================================
// 1. CREATE PETTY CASH VOUCHER
// ============================================
async function createPettyCashVoucher() {
  const response = await fetch('/api/petty-cash/vouchers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fundId: 'fund_id_here',
      payee: 'สมชาย ใจดี',
      description: 'ซื้อเอกสารสำนักงาน',
      amount: 500,
      glExpenseAccountId: 'expense_account_id_here',
      date: '2026-03-11',
    }),
  })

  const { success, data, error } = await response.json()

  if (success) {
    console.log('Voucher created:', data.voucherNo)
    // Output: Voucher created: PCV-2026-0001
    return data
  } else {
    console.error('Error:', error)
  }
}

// ============================================
// 2. APPROVE VOUCHER (Creates Journal Entry)
// ============================================
async function approveVoucher(voucherId: string) {
  const response = await fetch(`/api/petty-cash/vouchers/${voucherId}/approve`, {
    method: 'POST',
  })

  const { success, data, error, message } = await response.json()

  if (success) {
    console.log('Voucher approved:', message)
    console.log('Journal Entry:', data.journalEntry.entryNo)
    console.log('Debit:', data.journalEntry.totalDebit)
    console.log('Credit:', data.journalEntry.totalCredit)

    // Journal Entry Lines
    data.journalEntry.lines.forEach((line: any) => {
      console.log(`Line ${line.lineNo}:`)
      console.log(`  Account: ${line.accountId}`)
      console.log(`  Debit: ${line.debit}`)
      console.log(`  Credit: ${line.credit}`)
      console.log(`  Description: ${line.description}`)
    })

    return data
  } else {
    console.error('Error:', error)
  }
}

// ============================================
// 3. REIMBURSE FUND (Replenish Petty Cash)
// ============================================
async function reimburseFund(voucherId: string, cashBankAccountId: string) {
  const response = await fetch(`/api/petty-cash/vouchers/${voucherId}/reimburse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cashBankAccountId: cashBankAccountId,
    }),
  })

  const { success, data, error, message } = await response.json()

  if (success) {
    console.log('Fund reimbursed:', message)
    console.log('New balance:', data.newBalance)
    console.log('Journal Entry:', data.journalEntry.entryNo)
    return data
  } else {
    console.error('Error:', error)
  }
}

// ============================================
// 4. GET VOUCHER DETAILS
// ============================================
async function getVoucher(voucherId: string) {
  const response = await fetch(`/api/petty-cash/vouchers/${voucherId}`)
  const { success, data, error } = await response.json()

  if (success) {
    console.log('Voucher:', data.voucherNo)
    console.log('Amount:', data.amount)
    console.log('Status:', data.isReimbursed ? 'Reimbursed' : 'Pending reimbursement')
    console.log('Journal Entry:', data.journalEntryId || 'Not yet approved')
    console.log('Fund:', data.fund.name)
    console.log('Current Fund Balance:', data.fund.currentBalance)
    return data
  } else {
    console.error('Error:', error)
  }
}

// ============================================
// 5. DELETE VOUCHER (Only if not approved)
// ============================================
async function deleteVoucher(voucherId: string) {
  const response = await fetch(`/api/petty-cash/vouchers/${voucherId}`, {
    method: 'DELETE',
  })

  const { success, data, error, message } = await response.json()

  if (success) {
    console.log('Voucher deleted:', message)
    console.log('Fund balance restored')
    return data
  } else {
    console.error('Error:', error)
    // Common error: "ไม่สามารถลบใบเบิกที่ได้รับการอนุมัติแล้ว"
  }
}

// ============================================
// 6. LIST ALL VOUCHERS
// ============================================
async function listVouchers(fundId?: string) {
  const url = fundId
    ? `/api/petty-cash/vouchers?fundId=${fundId}`
    : '/api/petty-cash/vouchers'

  const response = await fetch(url)
  const { success, data, error } = await response.json()

  if (success) {
    console.log('Total vouchers:', data.length)

    data.forEach((voucher: any) => {
      console.log(`- ${voucher.voucherNo}: ${voucher.description}`)
      console.log(`  Amount: ${voucher.amount}`)
      console.log(`  Payee: ${voucher.payee}`)
      console.log(`  Date: ${voucher.date}`)
      console.log(`  Approved: ${voucher.journalEntryId ? 'Yes' : 'No'}`)
      console.log(`  Reimbursed: ${voucher.isReimbursed ? 'Yes' : 'No'}`)
    })

    return data
  } else {
    console.error('Error:', error)
  }
}

// ============================================
// 7. COMPLETE WORKFLOW EXAMPLE
// ============================================
async function completePettyCashWorkflow() {
  // Step 1: Create voucher
  const voucher = await createPettyCashVoucher()
  if (!voucher) return

  // Step 2: Approve voucher (creates journal entry)
  const approved = await approveVoucher(voucher.id)
  if (!approved) return

  // Step 3: Reimburse fund (optional)
  const cashBankAccountId = 'your_cash_bank_account_id'
  await reimburseFund(voucher.id, cashBankAccountId)

  // Step 4: Verify final state
  await getVoucher(voucher.id)
}

// ============================================
// 8. JOURNAL ENTRY VERIFICATION
// ============================================
async function verifyJournalEntry(journalEntryId: string) {
  const response = await fetch(`/api/journal/${journalEntryId}`)
  const { success, data } = await response.json()

  if (success) {
    const entry = data

    console.log('Journal Entry Verification:')
    console.log('Entry No:', entry.entryNo)
    console.log('Date:', entry.date)
    console.log('Description:', entry.description)
    console.log('Document Type:', entry.documentType)
    console.log('Document ID:', entry.documentId)
    console.log('Status:', entry.status)

    // Verify double-entry
    const totalDebit = entry.lines.reduce((sum: number, l: any) => sum + l.debit, 0)
    const totalCredit = entry.lines.reduce((sum: number, l: any) => sum + l.credit, 0)

    console.log('Total Debit:', totalDebit)
    console.log('Total Credit:', totalCredit)
    console.log('Balanced:', totalDebit === totalCredit ? 'YES ✓' : 'NO ✗')

    return entry
  }
}

// ============================================
// ERROR HANDLING EXAMPLES
// ============================================

// Example: Handle insufficient fund balance
async function createVoucherWithErrorHandling() {
  try {
    const response = await fetch('/api/petty-cash/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fundId: 'fund_id_here',
        payee: 'สมชาย ใจดี',
        description: 'Large expense',
        amount: 100000, // Exceeds fund balance
        glExpenseAccountId: 'expense_account_id_here',
      }),
    })

    const { success, error } = await response.json()

    if (!success) {
      if (error.includes('ไม่เพียงพอ')) {
        console.log('Insufficient fund balance:', error)
        // Handle: Notify user to reimburse fund first
      } else {
        console.log('Other error:', error)
      }
    }
  } catch (err) {
    console.error('Network error:', err)
  }
}

// Example: Handle already approved voucher
async function approveAlreadyApprovedVoucher(voucherId: string) {
  const response = await fetch(`/api/petty-cash/vouchers/${voucherId}/approve`, {
    method: 'POST',
  })

  const { success, error } = await response.json()

  if (!success) {
    if (error.includes('ได้รับการอนุมัติแล้ว')) {
      console.log('Voucher already approved')
      // Handle: Show current journal entry instead
    }
  }
}

export {
  createPettyCashVoucher,
  approveVoucher,
  reimburseFund,
  getVoucher,
  deleteVoucher,
  listVouchers,
  verifyJournalEntry,
}
