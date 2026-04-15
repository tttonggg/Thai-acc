import { db } from "@/lib/db"
import { relatedDocumentSchema } from "@/lib/validations"
import type { RelationType } from "@prisma/client"

interface RelatedDocumentDetails {
  id: string
  module: string
  documentNo: string
  documentDate: Date | string
  amount?: number
  status?: string
  customerName?: string
  vendorName?: string
}

// GET /api/invoices/[id]/related - List all related documents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check if invoice exists and user has access
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNo: true,
        createdById: true,
      }
    })

    if (!invoice) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }

    // IDOR Protection: Check ownership
    if (user.role !== "ADMIN" && invoice.createdById && invoice.createdById !== user.id) {
      return forbiddenError()
    }

    // Get all related documents (both directions)
    const [sourceRelated, targetRelated] = await Promise.all([
      // Documents this invoice links to (as source)
      db.relatedDocument.findMany({
        where: {
          sourceModule: "invoice",
          sourceId: id,
        },
        include: {
          // We'll fetch related document details separately
        },
      }),
      // Documents that link to this invoice (as target)
      db.relatedDocument.findMany({
        where: {
          relatedModule: "invoice",
          relatedId: id,
        },
      }),
    ])

    // Combine and deduplicate relationships
    const allRelations = [...sourceRelated, ...targetRelated]

    // Fetch details for each related document
    const relatedDocuments = await Promise.all(
      allRelations.map(async (relation) => {
        let details: RelatedDocumentDetails | null = null

        // Determine which module and ID to fetch
        const module = relation.sourceModule === "invoice" ? relation.relatedModule : relation.sourceModule
        const documentId = relation.sourceModule === "invoice" ? relation.relatedId : relation.sourceId

        switch (module) {
          case "receipt": {
            const receipt = await db.receipt.findUnique({
              where: { id: documentId },
              select: {
                id: true,
                receiptNo: true,
                receiptDate: true,
                amount: true,
                status: true,
              }
            })
            if (receipt) {
              details = {
                id: receipt.id,
                module: "receipt",
                documentNo: receipt.receiptNo,
                documentDate: receipt.receiptDate,
                amount: receipt.amount,
                status: receipt.status,
              }
            }
            break
          }
          case "credit_note": {
            const creditNote = await db.creditNote.findUnique({
              where: { id: documentId },
              select: {
                id: true,
                creditNoteNo: true,
                creditNoteDate: true,
                totalAmount: true,
                status: true,
                customer: {
                  select: {
                    name: true,
                  }
                }
              }
            })
            if (creditNote) {
              details = {
                id: creditNote.id,
                module: "credit_note",
                documentNo: creditNote.creditNoteNo,
                documentDate: creditNote.creditNoteDate,
                amount: creditNote.totalAmount,
                status: creditNote.status,
                customerName: creditNote.customer.name,
              }
            }
            break
          }
          case "debit_note": {
            const debitNote = await db.debitNote.findUnique({
              where: { id: documentId },
              select: {
                id: true,
                debitNoteNo: true,
                debitNoteDate: true,
                totalAmount: true,
                status: true,
                vendor: {
                  select: {
                    name: true,
                  }
                }
              }
            })
            if (debitNote) {
              details = {
                id: debitNote.id,
                module: "debit_note",
                documentNo: debitNote.debitNoteNo,
                documentDate: debitNote.debitNoteDate,
                amount: debitNote.totalAmount,
                status: debitNote.status,
                vendorName: debitNote.vendor.name,
              }
            }
            break
          }
          case "payment": {
            const payment = await db.payment.findUnique({
              where: { id: documentId },
              select: {
                id: true,
                paymentNo: true,
                paymentDate: true,
                amount: true,
                status: true,
                vendor: {
                  select: {
                    name: true,
                  }
                }
              }
            })
            if (payment) {
              details = {
                id: payment.id,
                module: "payment",
                documentNo: payment.paymentNo,
                documentDate: payment.paymentDate,
                amount: payment.amount,
                status: payment.status,
                vendorName: payment.vendor.name,
              }
            }
            break
          }
          case "invoice": {
            const relatedInvoice = await db.invoice.findUnique({
              where: { id: documentId },
              select: {
                id: true,
                invoiceNo: true,
                invoiceDate: true,
                totalAmount: true,
                status: true,
                customer: {
                  select: {
                    name: true,
                  }
                }
              }
            })
            if (relatedInvoice) {
              details = {
                id: relatedInvoice.id,
                module: "invoice",
                documentNo: relatedInvoice.invoiceNo,
                documentDate: relatedInvoice.invoiceDate,
                amount: relatedInvoice.totalAmount,
                status: relatedInvoice.status,
                customerName: relatedInvoice.customer.name,
              }
            }
            break
          }
        }

        return {
          id: relation.id,
          relationType: relation.relationType,
          direction: relation.sourceModule === "invoice" ? "outbound" : "inbound",
          notes: relation.notes,
          createdAt: relation.createdAt,
          details,
        }
      })
    )

    // Filter out null details and group by relation type
    const validRelations = relatedDocuments.filter((r) => r.details !== null)

    return apiResponse({
      invoiceId: id,
      invoiceNo: invoice.invoiceNo,
      relatedDocuments: validRelations,
      summary: {
        total: validRelations.length,
        links: validRelations.filter((r) => r.relationType === "LINKS").length,
        cancels: validRelations.filter((r) => r.relationType === "CANCELS").length,
        replaces: validRelations.filter((r) => r.relationType === "REPLACES").length,
        refunds: validRelations.filter((r) => r.relationType === "REFUNDS").length,
        adjusts: validRelations.filter((r) => r.relationType === "ADJUSTS").length,
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลเอกสารที่เกี่ยวข้อง")
  }
}

// POST /api/invoices/[id]/related - Link a related document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check permissions
    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์เชื่อมโยงเอกสาร", 403)
    }

    // Check if invoice exists and user has access
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNo: true,
        createdById: true,
        status: true,
      }
    })

    if (!invoice) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }

    // IDOR Protection: Check ownership
    if (user.role !== "ADMIN" && invoice.createdById && invoice.createdById !== user.id) {
      return forbiddenError()
    }

    const body = await request.json()
    const validatedData = relatedDocumentSchema.parse(body)

    // Validate that the related document exists
    let relatedDocumentExists = false
    switch (validatedData.relatedModule) {
      case "receipt":
        relatedDocumentExists = await db.receipt.count({
          where: { id: validatedData.relatedId }
        }) > 0
        break
      case "credit_note":
        relatedDocumentExists = await db.creditNote.count({
          where: { id: validatedData.relatedId }
        }) > 0
        break
      case "debit_note":
        relatedDocumentExists = await db.debitNote.count({
          where: { id: validatedData.relatedId }
        }) > 0
        break
      case "payment":
        relatedDocumentExists = await db.payment.count({
          where: { id: validatedData.relatedId }
        }) > 0
        break
      case "invoice":
        relatedDocumentExists = await db.invoice.count({
          where: { id: validatedData.relatedId }
        }) > 0
        break
    }

    if (!relatedDocumentExists) {
      return apiError("ไม่พบเอกสารที่เกี่ยวข้อง")
    }

    // Check if relationship already exists
    const existing = await db.relatedDocument.findUnique({
      where: {
        sourceModule_sourceId_relatedModule_relatedId: {
          sourceModule: "invoice",
          sourceId: id,
          relatedModule: validatedData.relatedModule,
          relatedId: validatedData.relatedId,
        }
      }
    })

    if (existing) {
      return apiError("มีการเชื่อมโยงเอกสารนี้อยู่แล้ว")
    }

    // Create relationship and audit log in transaction
    const result = await db.$transaction(async (tx) => {
      // Create the relationship
      const relation = await tx.relatedDocument.create({
        data: {
          sourceModule: "invoice",
          sourceId: id,
          relatedModule: validatedData.relatedModule,
          relatedId: validatedData.relatedId,
          relationType: validatedData.relationType,
          notes: validatedData.notes,
          createdById: user.id,
        }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          timestamp: new Date(),
          userId: user.id,
          action: "CREATE",
          entityType: "RelatedDocument",
          entityId: relation.id,
          afterState: {
            sourceModule: "invoice",
            sourceId: id,
            relatedModule: validatedData.relatedModule,
            relatedId: validatedData.relatedId,
            relationType: validatedData.relationType,
          },
          ipAddress: request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") ||
                     "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          hash: "", // Will be generated by database
        }
      })

      return relation
    })

    return apiResponse({
      message: "เชื่อมโยงเอกสารสำเร็จ",
      relation: result,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง")
    }
    console.error("Error linking document:", error)
    return apiError("เกิดข้อผิดพลาดในการเชื่อมโยงเอกสาร")
  }
}

// DELETE /api/invoices/[id]/related - Remove a relationship
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await params

    // Check permissions
    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์ลบความสัมพันธ์เอกสาร", 403)
    }

    // Check if invoice exists and user has access
    const invoice = await db.invoice.findUnique({
      where: { id },
      select: {
        id: true,
        invoiceNo: true,
        createdById: true,
      }
    })

    if (!invoice) {
      return notFoundError("ไม่พบใบกำกับภาษี")
    }

    // IDOR Protection: Check ownership
    if (user.role !== "ADMIN" && invoice.createdById && invoice.createdById !== user.id) {
      return forbiddenError()
    }

    // Get the related document ID from request body or query
    const url = new URL(request.url)
    const relatedId = url.searchParams.get("relatedId")

    if (!relatedId) {
      return apiError("ต้องระบุรหัสเอกสารที่เกี่ยวข้อง (relatedId)")
    }

    // Find the relationship
    const relation = await db.relatedDocument.findUnique({
      where: { id: relatedId }
    })

    if (!relation) {
      return notFoundError("ไม่พบความสัมพันธ์เอกสาร")
    }

    // Verify this relationship belongs to the invoice
    if (relation.sourceModule === "invoice" && relation.sourceId !== id) {
      return apiError("ความสัมพันธ์เอกสารนี้ไม่ใช่ของใบกำกับภาษีนี้", 403)
    }

    // Delete relationship and create audit log in transaction
    await db.$transaction(async (tx) => {
      // Store before state for audit
      const beforeState = {
        sourceModule: relation.sourceModule,
        sourceId: relation.sourceId,
        relatedModule: relation.relatedModule,
        relatedId: relation.relatedId,
        relationType: relation.relationType,
      }

      // Delete the relationship
      await tx.relatedDocument.delete({
        where: { id: relatedId }
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          timestamp: new Date(),
          userId: user.id,
          action: "DELETE",
          entityType: "RelatedDocument",
          entityId: relation.id,
          beforeState,
          ipAddress: request.headers.get("x-forwarded-for") ||
                     request.headers.get("x-real-ip") ||
                     "unknown",
          userAgent: request.headers.get("user-agent") || "unknown",
          hash: "", // Will be generated by database
        }
      })
    })

    return apiResponse({
      message: "ลบความสัมพันธ์เอกสารสำเร็จ",
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    console.error("Error unlinking document:", error)
    return apiError("เกิดข้อผิดพลาดในการลบความสัมพันธ์เอกสาร")
  }
}
