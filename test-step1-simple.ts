/**
 * Step 1 Test: Database Schema Functional Test
 * Tests actual database operations for the invoice commenting system
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseSchema() {
  console.log('='.repeat(60))
  console.log('📊 Step 1: Database Schema Functional Test')
  console.log('='.repeat(60))

  let passCount = 0
  let failCount = 0

  // Get test data
  const user = await prisma.user.findFirst({ select: { id: true, name: true } })
  const invoice = await prisma.invoice.findFirst({
    select: { id: true, invoiceNo: true },
    where: { status: 'DRAFT' }
  })
  const line = await prisma.invoiceLine.findFirst({
    select: { id: true, description: true }
  })

  if (!user || !invoice) {
    console.log('❌ Missing test data. Please ensure you have users and invoices.')
    console.log('   Run: npx prisma db seed')
    return false
  }

  console.log(`\n🔧 Test Data:`)
  console.log(`   User: ${user.name} (${user.id})`)
  console.log(`   Invoice: ${invoice.invoiceNo} (${invoice.id})`)
  if (line) {
    console.log(`   Line: ${line.description} (${line.id})`)
  }

  // Test 1: Create comment with all new fields
  console.log('\n📝 Test 1: Create Comment with Threading, Mentions, Attachments')
  try {
    const comment = await prisma.invoiceComment.create({
      data: {
        invoiceId: invoice.id,
        userId: user.id,
        content: 'Test comment with @mentions and attachments',
        isInternal: false,
        parentId: null, // Top-level comment
        mentions: [user.id], // Mention ourselves
        attachments: [
          { name: 'test.pdf', url: '/files/test.pdf', size: 12345, type: 'application/pdf' }
        ],
        resolved: false
      }
    })

    console.log(`   ✅ Created comment: ${comment.id}`)
    console.log(`   ✅ Has mentions: ${comment.mentions.length}`)
    console.log(`   ✅ Has attachments: ${comment.attachments ? comment.attachments.length : 0}`)
    console.log(`   ✅ Resolved status: ${comment.resolved}`)

    // Update to resolved
    const updated = await prisma.invoiceComment.update({
      where: { id: comment.id },
      data: {
        resolved: true,
        resolvedAt: new Date(),
        resolvedBy: user.id
      }
    })

    console.log(`   ✅ Updated resolved status: ${updated.resolved}`)
    console.log(`   ✅ Resolved at: ${updated.resolvedAt?.toISOString()}`)

    passCount++
    var testCommentId = comment.id
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    failCount++
  }

  // Test 2: Create threaded reply
  console.log('\n📝 Test 2: Create Threaded Reply')
  try {
    const reply = await prisma.invoiceComment.create({
      data: {
        invoiceId: invoice.id,
        userId: user.id,
        content: 'This is a reply to the parent comment',
        isInternal: false,
        parentId: testCommentId, // Reply to parent
        mentions: [],
        resolved: false
      }
    })

    console.log(`   ✅ Created reply: ${reply.id}`)
    console.log(`   ✅ Parent ID: ${reply.parentId}`)

    // Fetch with replies
    const withReplies = await prisma.invoiceComment.findUnique({
      where: { id: testCommentId },
      include: { replies: true }
    })

    console.log(`   ✅ Parent has ${withReplies?.replies.length || 0} replies`)

    passCount++
    var testReplyId = reply.id
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    failCount++
  }

  // Test 3: Create line item audit with structured fields
  if (line) {
    console.log('\n📝 Test 3: Create Line Item Audit with Structured Fields')
    try {
      const audit = await prisma.invoiceLineItemAudit.create({
        data: {
          lineItemId: line.id,
          action: 'UPDATED',
          field: 'quantity',
          oldValue: '10',
          newValue: '15',
          // Structured fields
          beforeQuantity: 10,
          afterQuantity: 15,
          quantityDiff: 5,
          beforeUnitPrice: 1000,
          afterUnitPrice: 1500,
          unitPriceDiff: 500,
          changeType: 'EDIT',
          changeReason: 'Customer requested more items',
          changedById: user.id,
          changedByName: user.name
        }
      })

      console.log(`   ✅ Created audit entry: ${audit.id}`)
      console.log(`   ✅ Action: ${audit.action}`)
      console.log(`   ✅ Field: ${audit.field}`)
      console.log(`   ✅ Quantity diff: ${audit.quantityDiff}`)
      console.log(`   ✅ Unit price diff: ${audit.unitPriceDiff}`)
      console.log(`   ✅ Change reason: ${audit.changeReason}`)

      passCount++
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`)
      failCount++
    }
  } else {
    console.log('\n📝 Test 3: Skipped (no invoice lines found)')
  }

  // Test 4: Create related document
  console.log('\n📝 Test 4: Create Related Document')
  try {
    const related = await prisma.relatedDocument.create({
      data: {
        sourceModule: 'invoice',
        sourceId: invoice.id,
        relatedModule: 'receipt',
        relatedId: 'test-receipt-id',
        relationType: 'LINKS',
        notes: 'Test relationship',
        createdById: user.id
      }
    })

    console.log(`   ✅ Created related document: ${related.id}`)
    console.log(`   ✅ Source: ${related.sourceModule}/${related.sourceId}`)
    console.log(`   ✅ Related: ${related.relatedModule}/${related.relatedId}`)
    console.log(`   ✅ Relation type: ${related.relationType}`)

    passCount++
    var testRelatedId = related.id
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    failCount++
  }

  // Test 5: Create comment notification
  console.log('\n📝 Test 5: Create Comment Notification')
  try {
    const notification = await prisma.commentNotification.create({
      data: {
        userId: user.id,
        commentId: testCommentId,
        invoiceId: invoice.id,
        type: 'MENTION',
        isRead: false
      }
    })

    console.log(`   ✅ Created notification: ${notification.id}`)
    console.log(`   ✅ Type: ${notification.type}`)
    console.log(`   ✅ Is read: ${notification.isRead}`)

    // Mark as read
    const read = await prisma.commentNotification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
        readAt: new Date()
      }
    })

    console.log(`   ✅ Marked as read: ${read.isRead}`)
    console.log(`   ✅ Read at: ${read.readAt?.toISOString()}`)

    passCount++
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    failCount++
  }

  // Test 6: Test cascade delete (reply deleted when parent deleted)
  console.log('\n📝 Test 6: Cascade Delete Test')
  try {
    // Check reply exists before delete
    const replyBefore = await prisma.invoiceComment.findUnique({
      where: { id: testReplyId }
    })
    console.log(`   ✅ Reply exists before parent delete: ${replyBefore ? 'Yes' : 'No'}`)

    // Delete parent comment (should cascade to replies)
    await prisma.invoiceComment.delete({
      where: { id: testCommentId }
    })
    console.log(`   ✅ Deleted parent comment: ${testCommentId}`)

    // Check reply was also deleted
    const replyAfter = await prisma.invoiceComment.findUnique({
      where: { id: testReplyId }
    })
    console.log(`   ✅ Reply exists after parent delete: ${replyAfter ? 'No (FAIL!)' : 'Yes (deleted)'}`)

    if (!replyAfter) {
      passCount++
    } else {
      console.log(`   ❌ Cascade delete failed! Reply still exists.`)
      failCount++
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    failCount++
  }

  // Test 7: Clean up test data
  console.log('\n📝 Test 7: Clean Up Test Data')
  try {
    // Delete related document
    if (testRelatedId) {
      await prisma.relatedDocument.delete({
        where: { id: testRelatedId }
      })
      console.log(`   ✅ Deleted test related document`)
    }

    // Delete audit entries
    if (line) {
      await prisma.invoiceLineItemAudit.deleteMany({
        where: { lineItemId: line.id }
      })
      console.log(`   ✅ Deleted test audit entries`)
    }

    passCount++
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`)
    failCount++
  }

  // Final Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${passCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`)

  if (failCount === 0) {
    console.log('\n🎉 All database schema tests passed!')
    console.log('✅ Step 1: Database Schema - VERIFIED')
    console.log('\nผลการทดสอบ Step 1:')
    console.log('   ✅ InvoiceComment model: Threading, mentions, attachments, resolved')
    console.log('   ✅ InvoiceLineItemAudit model: Structured fields, diff tracking')
    console.log('   ✅ RelatedDocument model: Document relationships')
    console.log('   ✅ CommentNotification model: User notifications')
    console.log('   ✅ Cascade delete: Working correctly')
    return true
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
    console.log('❌ Step 1: Database Schema - HAS ISSUES')
    return false
  }
}

// Run tests
testDatabaseSchema()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
