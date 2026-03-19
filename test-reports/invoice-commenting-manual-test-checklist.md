# Manual Testing Checklist: Invoice Commenting & Editing Feature

**Test Date**: _____________
**Tester**: _____________
**Browser**: _____________
**Screen Size**: _____________

---

## Test Environment Setup

- [ ] Development server running (`bun run dev`)
- [ ] Database seeded with test data
- [ ] Test user account available (accountant@thaiaccounting.com)
- [ ] At least one draft invoice available
- [ ] At least one posted/issued invoice
- [ ] Browser DevTools open for console errors
- [ ] Network tab open for API monitoring

---

## 1. Comment Adding Tests

### Basic Comment Creation
- [ ] Navigate to Invoices module
- [ ] Click on a draft invoice
- [ ] Click "Comments" tab
- [ ] Type comment in English: "Please check the VAT calculation"
- [ ] Click "Submit" or "Post Comment"
- [ ] **Verify**: Comment appears in the thread
- [ ] **Verify**: Timestamp shows current time
- [ ] **Verify**: User email/name is displayed
- [ ] **Verify**: No console errors

### Thai Language Comments
- [ ] Type comment in Thai: "กรุณาตรวจสอบยอด VAT"
- [ ] Submit comment
- [ ] **Verify**: Thai text displays correctly (no mojibake)
- [ ] **Verify**: Thai font is used (Sarabun, Prompt, or Kanit)
- [ ] **Verify**: Text is properly wrapped

### Mixed Language Comments
- [ ] Type: "Please verify ยอด VAT 7% before issuing"
- [ ] Submit comment
- [ ] **Verify**: Both languages render correctly

### Long Comments
- [ ] Type 1000 character comment
- [ ] Submit
- [ ] **Verify**: Comment is saved and displayed
- [ ] **Verify**: Comment is scrollable if needed

### Very Long Comments (Validation)
- [ ] Type 5001 characters (exceeds limit)
- [ ] Submit
- [ ] **Verify**: Validation error appears
- [ ] **Verify**: Error message mentions character limit
- [ ] **Verify**: Comment is not submitted

### Empty Comment Validation
- [ ] Leave comment field empty
- [ ] Click submit
- [ ] **Verify**: Submit button is disabled OR error appears
- [ ] **Verify**: Comment is not submitted

### Special Characters
- [ ] Type: "Price: ฿1,000.00 (VAT 7%) @ 50 ทวิ"
- [ ] Submit
- [ ] **Verify**: Special characters render correctly
- [ ] **Verify**: No XSS injection (check HTML source)

---

## 2. Comment Threading Tests

### Reply to Comment
- [ ] Find an existing comment
- [ ] Click "Reply" button
- [ ] Type reply: "I agree with this point"
- [ ] Submit
- [ ] **Verify**: Reply appears nested under parent
- [ ] **Verify**: Visual indentation shows thread structure
- [ ] **Verify**: Reply is linked to parent

### Nested Replies
- [ ] Reply to a reply (3rd level)
- [ ] Submit
- [ ] **Verify**: Nesting continues visually
- [ ] **Verify**: Maximum nesting level (if any)

### Edit Own Comment
- [ ] Click "Edit" on your own comment
- [ ] Modify text
- [ ] Save
- [ ] **Verify**: Updated text appears
- [ ] **Verify**: "Edited" badge/timestamp shows
- [ ] **Verify**: No "Edited" badge for new comments

### Delete Comment
- [ ] Click "Delete" on your own comment
- [ ] Confirm deletion
- [ ] **Verify**: Comment is removed
- [ ] **Verify**: Replies are also removed (cascade delete)
- [ ] **Verify**: "Deleted by user" placeholder (if enabled)

### Cannot Edit/Delete Others' Comments
- [ ] Try to click "Edit" on another user's comment
- [ ] **Verify**: Edit button is not visible OR disabled
- [ ] **Verify**: Admin can edit any comment (if role permits)

---

## 3. User Mentions & Notifications

### Mention User by Email
- [ ] Type: "@admin@thaiaccounting.com please review"
- [ ] **Verify**: Email is highlighted as mention
- [ ] Submit comment
- [ ] **Verify**: Mentioned user receives notification
- [ ] **Verify**: Notification links to invoice

### Multiple Mentions
- [ ] Type: "@user1@example.com and @user2@example.com please check"
- [ ] Submit
- [ ] **Verify**: Both users are mentioned
- [ ] **Verify**: Both receive notifications

### Notification Badge
- [ ] Check notification bell icon
- [ ] **Verify**: Badge shows count
- [ ] **Verify**: Count increments with new mentions
- [ ] Click notifications
- [ ] **Verify**: List shows recent mentions
- [ ] **Verify**: Clicking mention navigates to invoice

---

## 4. Comment Management

### Pin Important Comment
- [ ] Click "Pin" on a comment
- [ ] **Verify**: "Pinned" badge appears
- [ ] **Verify**: Pinned comment moves to top
- [ ] **Verify**: Pin icon is visible
- [ ] Unpin comment
- [ ] **Verify**: Comment returns to normal position

### Resolve Comment Thread
- [ ] Click "Resolve" on a comment
- [ ] **Verify**: "Resolved" badge appears
- [ ] **Verify**: Comment is grayed out (visual indication)
- [ ] **Verify**: Thread is collapsed (optional)
- [ ] Unresolve comment
- [ ] **Verify**: Badge is removed

### Filter Comments
- [ ] Use filter to show "All comments"
- [ ] Use filter to show "Unresolved only"
- [ ] Use filter to show "Pinned only"
- [ ] **Verify**: Filter results are correct

### Search Comments
- [ ] Type "VAT" in search box
- [ ] **Verify**: Only comments containing "VAT" are shown
- [ ] Clear search
- [ ] **Verify**: All comments reappear

---

## 5. Line Item Editing Tests

### Edit Quantity
- [ ] Open draft invoice
- [ ] Click "Edit Mode"
- [ ] Click edit on first line item
- [ ] Change quantity from 1 to 5
- [ ] Enter reason: "Customer requested additional units"
- [ ] Save
- [ ] **Verify**: Quantity updates to 5
- [ ] **Verify**: Line amount recalculates (price × quantity)
- [ ] **Verify**: Invoice total recalculates
- [ ] **Verify**: Audit log shows edit

### Edit Unit Price
- [ ] Edit line item
- [ ] Change unit price from 1,000 to 1,200
- [ ] Enter reason: "Price adjustment"
- [ ] Save
- [ ] **Verify**: Unit price updates
- [ ] **Verify**: Line amount recalculates
- [ ] **Verify**: VAT amount recalculates
- [ ] **Verify**: Total updates

### Edit Description
- [ ] Edit line item
- [ ] Change description to: "Premium Widget (Updated)"
- [ ] Save
- [ ] **Verify**: Description updates

### Multi-Field Edit
- [ ] Edit line item
- [ ] Change quantity, price, and description
- [ ] Save
- [ ] **Verify**: All fields update
- [ ] **Verify**: Audit log shows multi-field change

### Edit Reason Validation
- [ ] Edit line item
- [ ] Change quantity but leave reason empty
- [ ] Try to save
- [ ] **Verify**: Validation error "Reason is required"
- [ ] **Verify**: Cannot save without reason

### Cancel Edit
- [ ] Edit line item
- [ ] Make changes
- [ ] Click "Cancel"
- [ ] **Verify**: Dialog closes
- [ ] **Verify**: Original values remain unchanged
- [ ] **Verify**: No audit log entry created

### Edit Posted Invoice (Negative Test)
- [ ] Navigate to posted/issued invoice
- [ ] **Verify**: "Edit Mode" button is disabled
- [ ] **Verify**: OR "Edit Mode" button is not visible
- [ ] Try to access edit URL directly
- [ ] **Verify**: Error "Cannot edit posted invoice"

### Edit Paid Invoice (Negative Test)
- [ ] Navigate to paid invoice
- [ ] **Verify**: Editing is blocked
- [ ] **Verify**: Appropriate error message

---

## 6. Audit Trail Tests

### View Complete Audit Trail
- [ ] Navigate to invoice with activity
- [ ] Click "Audit" tab
- [ ] **Verify**: All events shown in timeline
- [ ] **Verify**: Events in chronological order (oldest first)
- [ ] **Verify**: Each event has timestamp
- [ ] **Verify**: Each event shows user who performed action

### Audit Event Types
- [ ] **Verify**: CREATE event shows
- [ ] **Verify**: UPDATE events show
- [ ] **Verify**: COMMENT events show
- [ ] **Verify**: LINE_EDIT events show
- [ ] **Verify**: Status change events show (ISSUE, VOID)

### View Line Edit Details
- [ ] Click on LINE_EDIT event
- [ ] **Verify**: Modal shows field changed
- [ ] **Verify**: Old value displayed
- [ ] **Verify**: New value displayed
- [ ] **Verify**: Change reason shown
- [ ] **Verify**: User who made change shown
- [ ] **Verify**: Timestamp of change shown

### Filter Audit Trail
- [ ] Select filter: "Comments only"
- [ ] **Verify**: Only COMMENT events shown
- [ ] Select filter: "Edits only"
- [ ] **Verify**: Only LINE_EDIT events shown
- [ ] Select filter: "All events"
- [ ] **Verify**: All events shown

### Date Range Filter
- [ ] Select date range: Last 7 days
- [ ] **Verify**: Only events in range shown
- [ ] Select date range: Today
- [ ] **Verify**: Only today's events shown

### Search Audit Trail
- [ ] Type "VAT" in search
- [ ] **Verify**: Only events containing "VAT" shown
- [ ] Type user email in search
- [ ] **Verify**: Only events by that user shown

### Export Audit Trail (PDF)
- [ ] Click "Export to PDF"
- [ ] **Verify**: PDF downloads
- [ ] **Verify**: PDF contains all audit events
- [ ] **Verify**: PDF formatting is readable
- [ ] **Verify**: Thai characters render in PDF

### Export Audit Trail (Excel)
- [ ] Click "Export to Excel"
- [ ] **Verify**: Excel file downloads
- [ ] **Verify**: File opens in Excel/Sheets
- [ ] **Verify**: All columns present
- [ ] **Verify**: Thai characters display correctly

---

## 7. Related Documents Tests

### View Related Receipts
- [ ] Navigate to invoice with receipts
- [ ] Click "Related" tab
- [ ] **Verify**: List of receipts shown
- [ ] **Verify**: Receipt numbers clickable
- [ ] **Verify**: Receipt amounts shown
- [ ] Click receipt
- [ ] **Verify**: Navigates to receipt detail

### View Related Credit Notes
- [ ] Navigate to invoice with credit notes
- [ ] Click "Related" tab
- [ ] **Verify**: Credit notes listed
- [ ] **Verify**: CN numbers shown
- [ ] Click credit note
- [ ] **Verify**: Navigates to CN detail

### Link Existing Document
- [ ] Click "Link Document" button
- [ ] Select document type (Receipt)
- [ ] Select from list
- [ ] **Verify**: Document appears in related list

### Unlink Document
- [ ] Click "Unlink" on related document
- [ ] Confirm
- [ ] **Verify**: Document removed from list

---

## 8. Thai Language Support

### UI Labels in Thai
- [ ] **Verify**: "Comments" = "ความคิดเห็น"
- [ ] **Verify**: "Audit" = "ประวัติการแก้ไข"
- [ ] **Verify**: "Related" = "เอกสารที่เกี่ยวข้อง"
- [ ] **Verify**: "Submit" = "ส่ง"
- [ ] **Verify**: "Cancel" = "ยกเลิก"

### Thai Date Formatting
- [ ] **Verify**: Dates show Buddhist era (2567 for 2024)
- [ ] **Verify**: Format: DD/MM/YYYY or DD/MM/BBBB
- [ ] **Verify**: Month names in Thai (if applicable)

### Thai Currency Formatting
- [ ] **Verify**: Currency symbol ฿ shown
- [ ] **Verify**: Decimal places (สตางค์) shown
- [ ] **Verify**: No comma placement issues

### Thai Text Input
- [ ] Type in comment field using Thai keyboard
- [ ] **Verify**: Input method accepts Thai
- [ ] **Verify**: No character encoding issues
- [ ] **Verify**: Cursor positioning correct

### Font Support
- [ ] Open DevTools → Inspector
- [ ] Check computed font-family
- [ ] **Verify**: Thai-compatible font used
- [ ] **Acceptable fonts: Sarabun, Prompt, Kanit, Noto Sans Thai

---

## 9. Mobile Responsiveness

### Comments on Mobile
- [ ] Open DevTools → Device Toolbar (iPhone SE: 375×667)
- [ ] Navigate to invoice comments
- [ ] **Verify**: Comments section visible
- [ ] **Verify**: Comment input field usable
- [ ] **Verify**: Submit button tappable (min 44×44px)
- [ ] **Verify**: Comments scrollable if needed

### Audit Trail on Mobile
- [ ] Navigate to audit tab
- [ ] **Verify**: Timeline visible
- [ ] **Verify**: Timeline scrollable
- [ ] **Verify**: Event cards not cramped
- [ ] **Verify**: Tap targets adequate size

### Line Edit Dialog on Mobile
- [ ] Open line edit dialog
- [ ] **Verify**: Dialog fits screen width
- [ ] **Verify**: Dialog scrollable if needed
- [ ] **Verify**: Input fields usable
- [ ] **Verify**: Save/Cancel buttons accessible

### Touch Interactions
- [ ] Test swipe gestures (if implemented)
- [ ] Test pull-to-refresh (if implemented)
- [ ] **Verify**: No unintended zoom on double-tap
- [ ] **Verify**: No text selection issues

---

## 10. Performance Tests

### Comment Loading Speed
- [ ] Open invoice with 50+ comments
- [ ] Start timer
- [ ] Navigate to comments tab
- [ ] **Verify**: Loads within 1 second
- [ ] **Verify**: No UI freezing

### Audit Trail Loading Speed
- [ ] Open invoice with extensive history
- [ ] Navigate to audit tab
- [ ] **Verify**: Loads within 2 seconds
- [ ] **Verify**: Smooth scrolling

### Comment Posting Speed
- [ ] Type and submit comment
- [ ] **Verify**: Appears within 500ms
- [ ] **Verify**: Optimistic UI updates (if implemented)

### Line Edit Save Speed
- [ ] Edit and save line item
- [ ] **Verify**: Saves within 500ms
- [ ] **Verify**: Total recalculates instantly

### Pagination Performance
- [ ] Navigate to invoice with 100+ comments
- [ ] Test pagination
- [ ] **Verify**: Page switches within 500ms
- [ ] **Verify**: No duplicate entries

---

## 11. Security Tests

### XSS Prevention
- [ ] Type: `<script>alert('XSS')</script>`
- [ ] Submit comment
- [ ] **Verify**: Script does NOT execute
- [ ] **Verify**: Text is sanitized/escaped
- [ ] Check page source: should be `&lt;script&gt;`

### SQL Injection Prevention
- [ ] Type: `'; DROP TABLE invoices; --`
- [ ] Submit
- [ ] **Verify**: Handled gracefully
- [ ] **Verify**: No database errors

### Authorization Checks
- [ ] Login as VIEWER user
- [ ] Try to add comment
- [ ] **Verify**: Either blocked OR limited permissions
- [ ] Try to edit line items
- [ ] **Verify**: Operation denied for non-draft invoices

### Session Expiry
- [ ] Add comment
- [ ] Logout
- [ ] Try to add another comment
- [ ] **Verify**: Redirected to login
- [ ] **Verify**: Comment not submitted

---

## 12. Browser Compatibility

### Chrome
- [ ] Test all core features in Chrome
- [ ] Verify no console errors
- [ ] Verify layout correct

### Firefox
- [ ] Test all core features in Firefox
- [ ] Verify no console errors
- [ ] Verify layout correct

### Safari
- [ ] Test all core features in Safari
- [ ] Verify Thai font rendering
- [ ] Verify no layout issues

### Edge
- [ ] Test all core features in Edge
- [ ] Verify no console errors

---

## 13. Error Handling

### Network Error
- [ ] Turn off network (DevTools → Offline)
- [ ] Try to submit comment
- [ ] **Verify**: User-friendly error message
- [ ] **Verify**: Retry option available

### Server Error
- [ ] Try to submit with server returning 500
- [ ] **Verify**: Error message shown
- [ ] **Verify**: Comment not lost (draft saved?)

### Validation Errors
- [ ] Submit empty comment
- [ ] Submit too-long comment
- [ ] **Verify**: Clear error messages
- [ ] **Verify**: Field highlighted

### Concurrent Editing
- [ ] Open invoice in two tabs
- [ ] Edit line item in Tab A
- [ ] Edit same line in Tab B
- [ ] Save Tab A
- [ ] Save Tab B
- [ ] **Verify**: Conflict detected (or last write wins)

---

## 14. Accessibility (A11y)

### Keyboard Navigation
- [ ] Navigate comments using Tab key
- [ ] **Verify**: Logical tab order
- [ ] **Verify**: Visible focus indicators
- [ ] Press Enter on buttons
- [ ] **Verify**: Actions work with keyboard

### Screen Reader Support
- [ ] Enable screen reader (VoiceOver/NVDA)
- [ ] Navigate comments
- [ ] **Verify**: Comments announced
- [ ] **Verify**: Buttons labeled
- [ ] **Verify**: Form fields have labels

### Color Contrast
- [ ] Check comment text contrast ratio
- [ ] **Verify**: WCAG AA compliant (4.5:1)
- [ ] Check button contrast
- [ ] **Verify**: Link contrast adequate

---

## 15. Edge Cases

### Unicode Characters
- [ ] Type emoji: 😀 👍 ✅
- [ ] Type symbols: © ® ™
- [ ] Type right-to-left text (Arabic/Hebrew if supported)
- [ ] **Verify**: All render correctly

### Zero-Width Characters
- [ ] Copy-paste text with zero-width spaces
- [ ] **Verify**: Handled gracefully

### Very Long Words
- [ ] Type 100-character word without spaces
- [ ] **Verify**: Word wraps or truncates
- [ ] **Verify**: Doesn't break layout

### Rapid Sequential Actions
- [ ] Quickly submit 5 comments
- [ ] **Verify**: All saved
- [ ] **Verify**: Correct order maintained

---

## Test Results Summary

**Total Tests**: _______
**Passed**: _______
**Failed**: _______
**Skipped**: _______

### Critical Bugs Found:
1. __________________________________________________________
2. __________________________________________________________
3. __________________________________________________________

### Minor Issues Found:
1. __________________________________________________________
2. __________________________________________________________
3. __________________________________________________________

### Performance Metrics:
- Comment Load Time: ______ ms
- Audit Load Time: ______ ms
- Line Edit Save Time: ______ ms
- Export PDF Time: ______ ms

### Recommendations:
1. __________________________________________________________
2. __________________________________________________________
3. __________________________________________________________

---

**Tester Signature**: _____________
**Date**: _____________
