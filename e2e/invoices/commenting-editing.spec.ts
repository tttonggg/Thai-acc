/**
 * E2E Tests for Invoice Commenting and Editing Feature
 * Tests user-facing functionality with Playwright
 */

import { test, expect } from '@playwright/test';

test.describe('Invoice Commenting Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login as accountant
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should add comment to draft invoice', async ({ page }) => {
    // Navigate to invoices
    await page.click('text=ใบกำกับภาษี');
    await page.waitForURL('**/invoices');

    // Click on first draft invoice
    await page.click('text=INV-202603');
    await page.waitForSelector('[data-testid="invoice-detail"]');

    // Click on comments tab
    await page.click('[data-testid="comments-tab"]');
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();

    // Add comment
    await page.fill('[data-testid="comment-input"]', 'กรุณาตรวจสอบ VAT 7%');
    await page.click('[data-testid="submit-comment"]');

    // Wait for comment to appear
    await expect(page.locator('text=กรุณาตรวจสอบ VAT 7%')).toBeVisible();

    // Verify comment metadata
    await expect(page.locator('text=accountant@thaiaccounting.com')).toBeVisible();
    await expect(page.locator('[data-testid="comment-timestamp"]')).toBeVisible();
  });

  test('should display Thai language correctly', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('text=DRAFT');

    // Navigate to first invoice
    await page.click('[data-testid="invoice-row"] :first-child');
    await page.waitForURL(/\/invoices\/[^/]+$/);

    // Open comments
    await page.click('[data-testid="comments-tab"]');

    // Add Thai comment
    const thaiText = 'ลูกค้าขอเปลี่ยนวันที่ครบกำหนดเป็น 30 เมษายน 2567';
    await page.fill('[data-testid="comment-input"]', thaiText);
    await page.click('[data-testid="submit-comment"]');

    // Verify Thai text renders correctly (not mojibake)
    const comment = page.locator(`text=${thaiText}`);
    await expect(comment).toBeVisible();

    // Check font supports Thai
    const fontFamily = await comment.evaluate((el) => window.getComputedStyle(el).fontFamily);
    expect(fontFamily).toMatch(/Sarabun|Prompt|Kanit|Thai|Noto Sans Thai/);
  });

  test('should support mixed Thai/English comments', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    const mixedText = 'Please verify ยอด VAT 7% before issuing';
    await page.fill('[data-testid="comment-input"]', mixedText);
    await page.click('[data-testid="submit-comment"]');

    await expect(page.locator(`text=${mixedText}`)).toBeVisible();
  });

  test('should support comment threading (replies)', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    // Add parent comment
    await page.fill('[data-testid="comment-input"]', 'Need to verify pricing');
    await page.click('[data-testid="submit-comment"]');
    await expect(page.locator('text=Need to verify pricing')).toBeVisible();

    // Click reply button
    await page.click('[data-testid="comment-thread"] [data-testid="reply-button"]');

    // Add reply
    await page.fill('[data-testid="reply-input"]', 'Pricing verified, looks good');
    await page.click('[data-testid="submit-reply"]');

    // Verify thread structure
    await expect(page.locator('.comment-thread .comment-reply')).toBeVisible();
    await expect(page.locator('text=Pricing verified, looks good')).toBeVisible();

    // Verify indentation/threading visual
    const replyElement = page.locator('.comment-reply');
    const marginLeft = await replyElement.evaluate((el) => window.getComputedStyle(el).marginLeft);
    expect(parseInt(marginLeft)).toBeGreaterThan(0);
  });

  test('should notify mentioned users', async ({ page, context }) => {
    // Create a notification panel check
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    // Mention another user
    await page.fill('[data-testid="comment-input"]', '@admin@thaiaccounting.com please review');
    await page.click('[data-testid="submit-comment"]');

    // Verify mention highlight in UI
    await expect(page.locator('.mention-highlight')).toBeVisible();

    // Check notification badge (if visible)
    const notificationBadge = page.locator('[data-testid="notification-badge"]');
    const hasBadge = (await notificationBadge.count()) > 0;

    if (hasBadge) {
      const badgeCount = await notificationBadge.textContent();
      expect(parseInt(badgeCount || '0')).toBeGreaterThan(0);
    }
  });

  test('should resolve comment thread', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    // Add comment
    await page.fill('[data-testid="comment-input"]', 'Question about pricing');
    await page.click('[data-testid="submit-comment"]');

    // Resolve comment
    await page.click('[data-testid="comment-thread"] [data-testid="resolve-button"]');

    // Verify resolved state
    await expect(page.locator('.comment-resolved')).toBeVisible();
    await expect(page.locator('text=Resolved')).toBeVisible();

    // Unresolve comment
    await page.click('[data-testid="comment-thread"] [data-testid="unresolve-button"]');
    await expect(page.locator('.comment-resolved')).not.toBeVisible();
  });

  test('should pin important comments', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    // Add comment
    await page.fill(
      '[data-testid="comment-input"]',
      'IMPORTANT: Customer requires separate receipt'
    );
    await page.click('[data-testid="submit-comment"]');

    // Pin comment
    await page.click('[data-testid="comment-thread"] [data-testid="pin-button"]');

    // Verify pinned state and order
    await expect(page.locator('.comment-pinned')).toBeVisible();
    await expect(page.locator('text=Pinned')).toBeVisible();

    // Pinned comment should appear first
    const firstComment = page.locator('[data-testid="comments-section"] > div:first-child');
    await expect(firstComment).toHaveClass(/pinned/);
  });

  test('should validate comment length', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    // Try to submit very long comment
    const longComment = 'x'.repeat(5001);

    await page.fill('[data-testid="comment-input"]', longComment);
    await page.click('[data-testid="submit-comment"]');

    // Should show validation error
    await expect(page.locator('text=too long|exceeds|5000')).toBeVisible();

    // Comment should not be added
    await expect(page.locator(`text=${longComment.substring(0, 50)}`)).not.toBeVisible();
  });

  test('should prevent empty comments', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="comments-tab"]');

    // Try to submit empty comment
    await page.click('[data-testid="submit-comment"]');

    // Button should be disabled or show error
    const submitButton = page.locator('[data-testid="submit-comment"]');
    await expect(submitButton).toBeDisabled();

    // Or show error message
    const errorMessage = page.locator('text=required|empty|enter comment');
    const hasError = (await errorMessage.count()) > 0;

    if (hasError) {
      await expect(errorMessage).toBeVisible();
    }
  });
});

test.describe('Invoice Line Item Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should edit line item in draft invoice', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('text=DRAFT');

    // Navigate to draft invoice
    await page.click('[data-testid="invoice-row"] :first-child');
    await page.waitForURL(/\/invoices\/[^/]+$/);

    // Enable edit mode
    await page.click('[data-testid="edit-mode-button"]');
    await expect(page.locator('[data-testid="line-edit-mode"]')).toBeVisible();

    // Click edit on first line item
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');

    // Edit dialog should appear
    await expect(page.locator('[data-testid="line-edit-dialog"]')).toBeVisible();

    // Update quantity
    await page.fill('[data-testid="edit-quantity"]', '10');

    // Provide reason
    await page.fill('[data-testid="edit-reason"]', 'Customer requested additional units');

    // Save changes
    await page.click('[data-testid="save-line-edit"]');

    // Wait for dialog to close
    await expect(page.locator('[data-testid="line-edit-dialog"]')).not.toBeVisible();

    // Verify update
    await expect(page.locator('[data-testid="line-quantity"]')).toContainText('10');
  });

  test('should recalculate totals after line edit', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    // Get initial total
    const beforeTotal = await page.textContent('[data-testid="invoice-total"]');
    const beforeTotalNum = parseFloat(beforeTotal?.replace(/[^0-9.]/g, '') || '0');

    // Edit line item
    await page.click('[data-testid="edit-mode-button"]');
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');
    await page.fill('[data-testid="edit-quantity"]', '20');
    await page.fill('[data-testid="edit-reason"]', 'Update quantity');
    await page.click('[data-testid="save-line-edit"]');

    // Wait for recalculation
    await page.waitForTimeout(500);

    // Get new total
    const afterTotal = await page.textContent('[data-testid="invoice-total"]');
    const afterTotalNum = parseFloat(afterTotal?.replace(/[^0-9.]/g, '') || '0');

    expect(afterTotalNum).toBeGreaterThan(beforeTotalNum);
  });

  test('should require edit reason', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="edit-mode-button"]');
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');

    // Try to save without reason
    await page.fill('[data-testid="edit-quantity"]', '5');
    await page.click('[data-testid="save-line-edit"]');

    // Should show validation error
    await expect(page.locator('text=reason|required')).toBeVisible();

    // Or button should be disabled
    const saveButton = page.locator('[data-testid="save-line-edit"]');
    const isDisabled = await saveButton.isDisabled();
    expect(isDisabled).toBe(true);
  });

  test('should prevent edits to posted invoices', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('text=ISSUED');

    // Navigate to posted invoice
    await page.click('[data-testid="invoice-row"] :first-child');

    // Edit button should be disabled or hidden
    const editButton = page.locator('[data-testid="edit-mode-button"]');
    await expect(editButton).toBeDisabled();

    // Or edit button not visible
    const isVisible = await editButton.isVisible();
    if (isVisible) {
      await expect(editButton).toBeDisabled();
    }
  });

  test('should prevent edits to paid invoices', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('text=PAID');

    await page.click('[data-testid="invoice-row"] :first-child');

    // Edit should not be available
    const editButton = page.locator('[data-testid="edit-mode-button"]');
    await expect(editButton).not.toBeVisible();

    // Try to navigate to edit URL directly
    await page.goto(page.url() + '/edit');
    await expect(page.locator('text=cannot edit|already paid')).toBeVisible();
  });

  test('should cancel line edit operation', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="edit-mode-button"]');
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');

    // Make changes
    await page.fill('[data-testid="edit-quantity"]', '5');

    // Cancel
    await page.click('[data-testid="cancel-line-edit"]');

    // Dialog should close without saving
    await expect(page.locator('[data-testid="line-edit-dialog"]')).not.toBeVisible();

    // Original value should remain
    const lineQuantity = await page.textContent('[data-testid="line-quantity"]');
    expect(lineQuantity).not.toBe('5');
  });

  test('should support multi-field edits', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="edit-mode-button"]');
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');

    // Edit multiple fields
    await page.fill('[data-testid="edit-quantity"]', '10');
    await page.fill('[data-testid="edit-unit-price"]', '12000');
    await page.fill('[data-testid="edit-description"]', 'Updated description');

    await page.fill('[data-testid="edit-reason"]', 'Multiple fields update');
    await page.click('[data-testid="save-line-edit"]');

    // Verify all fields updated
    await expect(page.locator('[data-testid="line-quantity"]')).toContainText('10');
    await expect(page.locator('[data-testid="line-unit-price"]')).toContainText('12000');
    await expect(page.locator('[data-testid="line-description"]')).toContainText(
      'Updated description'
    );
  });
});

test.describe('Audit Trail Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display complete audit timeline', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    // Click audit tab
    await page.click('[data-testid="audit-tab"]');
    await expect(page.locator('[data-testid="audit-timeline"]')).toBeVisible();

    // Check audit events are displayed
    const events = page.locator('[data-testid="audit-event"]');
    const eventCount = await events.count();

    expect(eventCount).toBeGreaterThan(0);

    // Verify events have required attributes
    await expect(events.first()).toHaveAttribute('data-type');
    await expect(events.first()).toHaveAttribute('data-timestamp');
  });

  test('should show events in chronological order', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    const events = page.locator('[data-testid="audit-event"]');
    const firstEvent = await events.first().textContent();
    const lastEvent = await events.last().textContent();

    // First event should be creation
    expect(firstEvent).toMatch(/Created|สร้าง/);

    // Last event should be most recent
    expect(lastEvent).toBeTruthy();
  });

  test('should show before/after values for edits', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    // Click on edit event to see details
    await page.click('[data-testid="audit-event"][data-type="LINE_EDIT"]');

    // Verify change details
    await expect(page.locator('[data-testid="change-details-dialog"]')).toBeVisible();
    await expect(page.locator('[data-testid="change-field"]')).toBeVisible();
    await expect(page.locator('[data-testid="old-value"]')).toBeVisible();
    await expect(page.locator('[data-testid="new-value"]')).toBeVisible();

    // Verify specific values
    const field = await page.textContent('[data-testid="change-field"]');
    expect(field).toMatch(/quantity|price|description/);
  });

  test('should filter audit events by type', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    // Get all events count
    const allEvents = await page.locator('[data-testid="audit-event"]').count();

    // Filter to comments only
    await page.selectOption('[data-testid="audit-filter"]', 'COMMENT');

    // Verify filtered results
    const commentEvents = await page.locator('[data-testid="audit-event"]').count();
    expect(commentEvents).toBeLessThanOrEqual(allEvents);

    // All visible events should be comments
    const firstEventType = await page
      .locator('[data-testid="audit-event"]:first-child')
      .getAttribute('data-type');
    expect(firstEventType).toBe('COMMENT');
  });

  test('should search audit trail', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    // Search for specific term
    await page.fill('[data-testid="audit-search"]', 'VAT');

    // Wait for search results
    await page.waitForTimeout(500);

    // Verify search filtered events
    const events = await page.locator('[data-testid="audit-event"]').allTextContents();
    const allMatch = events.every((e) => e.includes('VAT'));

    if (events.length > 0) {
      expect(allMatch).toBe(true);
    }
  });

  test('should export audit trail to PDF', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    // Click export button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-audit-pdf"]');
    const download = await downloadPromise;

    // Verify file
    expect(download.suggestedFilename()).toMatch(/audit.*\.pdf/);
  });

  test('should export audit trail to Excel', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-audit-excel"]');
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/audit.*\.xlsx?/);
  });
});

test.describe('Related Documents', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should show related receipts', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    // Click related tab
    await page.click('[data-testid="related-tab"]');

    // Should show related documents section
    await expect(page.locator('[data-testid="related-documents"]')).toBeVisible();

    // Check for receipts
    const receipts = page.locator('[data-testid="related-receipt"]');
    const hasReceipts = (await receipts.count()) > 0;

    if (hasReceipts) {
      await expect(receipts.first()).toBeVisible();
    }
  });

  test('should show related credit notes', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="related-tab"]');

    const creditNotes = page.locator('[data-testid="related-credit-note"]');
    const hasCreditNotes = (await creditNotes.count()) > 0;

    if (hasCreditNotes) {
      await expect(creditNotes.first()).toBeVisible();
    }
  });

  test('should navigate to related documents', async ({ page }) => {
    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="related-tab"]');

    // Click on related document
    const relatedDoc = page.locator('[data-testid="related-document"]:first-child');
    const hasRelatedDoc = (await relatedDoc.count()) > 0;

    if (hasRelatedDoc) {
      await relatedDoc.click();

      // Should navigate to document detail
      await page.waitForURL(/\/(receipts|credit-notes)/);
      await expect(page).toHaveURL(/\/(receipts|credit-notes)\/[^/]+$/);
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('comments work on mobile', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    // Comments section should be accessible
    await page.click('[data-testid="comments-tab"]');
    await expect(page.locator('[data-testid="comments-section"]')).toBeVisible();

    // Comment input should be usable
    await expect(page.locator('[data-testid="comment-input"]')).toBeVisible();
    await page.fill('[data-testid="comment-input"]', 'Test comment from mobile');
    await page.click('[data-testid="submit-comment"]');

    await expect(page.locator('text=Test comment from mobile')).toBeVisible();
  });

  test('audit trail is scrollable on mobile', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="audit-tab"]');

    // Audit timeline should be visible
    await expect(page.locator('[data-testid="audit-timeline"]')).toBeVisible();

    // Should be scrollable if content overflows
    const timeline = page.locator('[data-testid="audit-timeline"]');
    const overflowY = await timeline.evaluate((el) => window.getComputedStyle(el).overflowY);
    expect(['auto', 'scroll', 'overlay']).toContain(overflowY);
  });

  test('line edit dialog fits mobile screen', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="edit-mode-button"]');
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');

    // Dialog should fit screen
    const dialog = page.locator('[data-testid="line-edit-dialog"]');
    await expect(dialog).toBeVisible();

    const dialogBox = await dialog.boundingBox();
    expect(dialogBox?.width).toBeLessThanOrEqual(375);
  });

  test('touch targets are large enough on mobile', async ({ page, viewport }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    // Check button sizes
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const isVisible = await button.isVisible();

      if (isVisible) {
        const box = await button.boundingBox();
        if (box) {
          // Touch targets should be at least 44x44px (iOS HIG)
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    }
  });
});

test.describe('Performance', () => {
  test('comments load within 1 second', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    const startTime = Date.now();
    await page.click('[data-testid="comments-tab"]');
    await page.waitForSelector('[data-testid="comments-section"]');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000);
  });

  test('audit trail loads within 2 seconds', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    const startTime = Date.now();
    await page.click('[data-testid="audit-tab"]');
    await page.waitForSelector('[data-testid="audit-timeline"]');
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });

  test('line edit saves within 500ms', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.fill('input[name="email"]', 'accountant@thaiaccounting.com');
    await page.fill('input[name="password"]', 'acc123');
    await page.click('button[type="submit"]');

    await page.goto('http://localhost:3000/invoices');
    await page.click('[data-testid="invoice-row"] :first-child');

    await page.click('[data-testid="edit-mode-button"]');
    await page.click('[data-testid="line-item-1"] [data-testid="edit-line-button"]');

    await page.fill('[data-testid="edit-quantity"]', '5');
    await page.fill('[data-testid="edit-reason"]', 'Test edit');

    const startTime = Date.now();
    await page.click('[data-testid="save-line-edit"]');
    await page.waitForSelector('[data-testid="line-edit-dialog"]', { state: 'hidden' });
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(500);
  });
});
