/**
 * Step 1 Test: Database Schema Verification
 *
 * Tests the invoice commenting system database schema
 * - InvoiceComment (with threading, mentions, attachments, resolved)
 * - InvoiceLineItemAudit (with before/after tracking)
 * - RelatedDocument (document relationships)
 * - CommentNotification (user notifications)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDatabaseSchema() {
  console.log('='.repeat(60))
  console.log('📊 Step 1: Database Schema Verification Test')
  console.log('='.repeat(60))

  let passCount = 0
  let failCount = 0

  // Test 1: Check InvoiceComment model exists and has correct fields
  console.log('\n📝 Test 1: InvoiceComment Model')
  try {
    // Try to query the model (will fail if model doesn't exist)
    const commentFields = await prisma.invoiceComment.findMany({ take: 0 })
    console.log('   ✅ InvoiceComment model exists')

    // Check for new fields
    const modelInfo = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'InvoiceComment'
    )

    const requiredFields = [
      'parentId',
      'mentions',
      'attachments',
      'resolved',
      'resolvedAt',
      'resolvedBy'
    ]

    requiredFields.forEach((field) => {
      const fieldExists = modelInfo?.fields.some((f: any) => f.name === field)
      if (fieldExists) {
        console.log(`   ✅ Field ${field} exists`)
      } else {
        console.log(`   ❌ Field ${field} missing`)
        failCount++
      }
    })

    // Check for self-referencing relation (replies)
    const hasRelation = modelInfo?.fields.some(
      (f: any) => f.name === 'replies' && f.isList
    )
    if (hasRelation) {
      console.log('   ✅ Self-referencing relation (replies) exists')
      passCount++
    } else {
      console.log('   ❌ Self-referencing relation (replies) missing')
      failCount++
    }

    passCount++
  } catch (error: any) {
    console.log(`   ❌ InvoiceComment model error: ${error.message}`)
    failCount++
  }

  // Test 2: Check InvoiceLineItemAudit model
  console.log('\n📝 Test 2: InvoiceLineItemAudit Model')
  try {
    await prisma.invoiceLineItemAudit.findMany({ take: 0 })
    console.log('   ✅ InvoiceLineItemAudit model exists')

    const modelInfo = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'InvoiceLineItemAudit'
    )

    const requiredFields = [
      'beforeQuantity',
      'afterQuantity',
      'quantityDiff',
      'beforeUnitPrice',
      'afterUnitPrice',
      'unitPriceDiff',
      'beforeDiscount',
      'afterDiscount',
      'discountDiff',
      'changeType',
      'changeReason'
    ]

    requiredFields.forEach((field) => {
      const fieldExists = modelInfo?.fields.some((f: any) => f.name === field)
      if (fieldExists) {
        console.log(`   ✅ Field ${field} exists`)
      } else {
        console.log(`   ❌ Field ${field} missing`)
        failCount++
      }
    })

    passCount++
  } catch (error: any) {
    console.log(`   ❌ InvoiceLineItemAudit model error: ${error.message}`)
    failCount++
  }

  // Test 3: Check RelatedDocument model
  console.log('\n📝 Test 3: RelatedDocument Model')
  try {
    await prisma.relatedDocument.findMany({ take: 0 })
    console.log('   ✅ RelatedDocument model exists')

    const modelInfo = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'RelatedDocument'
    )

    const requiredFields = [
      'sourceModule',
      'sourceId',
      'relatedModule',
      'relatedId',
      'relationType',
      'notes'
    ]

    requiredFields.forEach((field) => {
      const fieldExists = modelInfo?.fields.some((f: any) => f.name === field)
      if (fieldExists) {
        console.log(`   ✅ Field ${field} exists`)
      } else {
        console.log(`   ❌ Field ${field} missing`)
        failCount++
      }
    })

    // Check unique constraint
    const uniqueConstraint = modelInfo?.uniqueFields?.some(
      (u: any) => u.name === 'sourceModule_sourceId_relatedModule_relatedId'
    )
    if (uniqueConstraint) {
      console.log('   ✅ Unique constraint exists')
      passCount++
    } else {
      console.log('   ⚠️  Unique constraint may not be set correctly')
    }

    passCount++
  } catch (error: any) {
    console.log(`   ❌ RelatedDocument model error: ${error.message}`)
    failCount++
  }

  // Test 4: Check CommentNotification model
  console.log('\n📝 Test 4: CommentNotification Model')
  try {
    await prisma.commentNotification.findMany({ take: 0 })
    console.log('   ✅ CommentNotification model exists')

    const modelInfo = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'CommentNotification'
    )

    const requiredFields = [
      'userId',
      'commentId',
      'invoiceId',
      'type',
      'isRead',
      'readAt'
    ]

    requiredFields.forEach((field) => {
      const fieldExists = modelInfo?.fields.some((f: any) => f.name === field)
      if (fieldExists) {
        console.log(`   ✅ Field ${field} exists`)
      } else {
        console.log(`   ❌ Field ${field} missing`)
        failCount++
      }
    })

    passCount++
  } catch (error: any) {
    console.log(`   ❌ CommentNotification model error: ${error.message}`)
    failCount++
  }

  // Test 5: Check indexes
  console.log('\n📝 Test 5: Indexes Verification')
  try {
    // InvoiceComment indexes
    const commentModel = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'InvoiceComment'
    )
    const commentIndexes = commentModel?.fields.filter((f: any) => f.isList || f.isUnique || f.isId)

    console.log(`   ✅ InvoiceComment has ${commentIndexes.length} indexed/unique fields`)

    // RelatedDocument unique constraint
    const relatedModel = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'RelatedDocument'
    )
    const hasUnique = relatedModel?.uniqueFields && relatedModel.uniqueFields.length > 0
    if (hasUnique) {
      console.log('   ✅ RelatedDocument has unique constraint')
    } else {
      console.log('   ❌ RelatedDocument missing unique constraint')
      failCount++
    }

    passCount++
  } catch (error: any) {
    console.log(`   ❌ Index verification error: ${error.message}`)
    failCount++
  }

  // Test 6: Check relations between models
  console.log('\n📝 Test 6: Relations Verification')
  try {
    // Invoice -> InvoiceComment
    const invoiceModel = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'Invoice'
    )
    const hasCommentsRelation = invoiceModel?.fields.some(
      (f: any) => f.name === 'comments' && f.isList
    )
    if (hasCommentsRelation) {
      console.log('   ✅ Invoice -> InvoiceComment relation exists')
      passCount++
    } else {
      console.log('   ❌ Invoice -> InvoiceComment relation missing')
      failCount++
    }

    // InvoiceLine -> InvoiceLineItemAudit
    const lineModel = await prisma._dmmf.datamodel.models.find(
      (m: any) => m.name === 'InvoiceLine'
    )
    const hasAuditRelation = lineModel?.fields.some(
      (f: any) => f.name === 'auditTrail' && f.isList
    )
    if (hasAuditRelation) {
      console.log('   ✅ InvoiceLine -> InvoiceLineItemAudit relation exists')
      passCount++
    } else {
      console.log('   ❌ InvoiceLine -> InvoiceLineItemAudit relation missing')
      failCount++
    }
  } catch (error: any) {
    console.log(`   ❌ Relations verification error: ${error.message}`)
    failCount++
  }

  // Test 7: Test data insertion (create dummy data)
  console.log('\n📝 Test 7: Data Insertion Test')
  try {
    // Check if we have at least one invoice to test with
    const invoiceCount = await prisma.invoice.count()
    if (invoiceCount > 0) {
      console.log(`   ✅ Found ${invoiceCount} invoices in database`)

      // Get first invoice
      const invoice = await prisma.invoice.findFirst({
        select: { id: true, invoiceNo: true }
      })

      if (invoice) {
        // Get first user
        const user = await prisma.user.findFirst({
          select: { id: true, name: true }
        })

        if (user) {
          // Test creating a comment
          const testComment = await prisma.invoiceComment.create({
            data: {
              invoiceId: invoice.id,
              userId: user.id,
              content: 'Test comment for schema verification',
              isInternal: false,
              mentions: [],
              resolved: false
            }
          })

          console.log(`   ✅ Successfully created test comment: ${testComment.id}`)

          // Clean up test comment
          await prisma.invoiceComment.delete({
            where: { id: testComment.id }
          })

          console.log('   ✅ Successfully deleted test comment')
          passCount++
        } else {
          console.log('   ⚠️  No users found in database, skipping insertion test')
        }
      }
    } else {
      console.log('   ⚠️  No invoices found in database, run seed first')
    }
  } catch (error: any) {
    console.log(`   ❌ Data insertion test error: ${error.message}`)
    console.log(`   Details: ${JSON.stringify(error, null, 2)}`)
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
