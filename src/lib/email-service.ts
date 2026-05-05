import nodemailer from 'nodemailer'
import { prisma } from '@/lib/db'
import { satangToBaht } from './currency'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SmtpConfig {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpFromEmail: string
  smtpFromName: string
}

interface ReminderResult {
  invoiceId: string
  invoiceNo: string
  customerName: string
  daysOverdue: number
  level: 1 | 2 | 3
  sent: boolean
  error?: string
}

// ─── Transporter factory ──────────────────────────────────────────────────────

function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  })
}

// ─── Core send ───────────────────────────────────────────────────────────────

export async function sendEmail(opts: {
  to: string
  subject: string
  html: string
  smtpConfig: SmtpConfig
}): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(opts.smtpConfig)
    await transporter.sendMail({
      from: `"${opts.smtpConfig.smtpFromName}" <${opts.smtpConfig.smtpFromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

// ─── Reminder level labels ───────────────────────────────────────────────────

function reminderLabel(level: 1 | 2 | 3): string {
  if (level === 1) return 'แจ้งเตือน'
  if (level === 2) return 'เรียกชำระ'
  return 'ขอติดตาม'
}

// ─── Invoice reminder email ───────────────────────────────────────────────────

function buildReminderHtml(opts: {
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  amount: number // Satang
  daysOverdue: number
  level: 1 | 2 | 3
  customerName: string
  companyName: string
  bankAccount?: string
}): string {
  const baht = satangToBaht(opts.amount)
  const levelLabel = reminderLabel(opts.level)
  const due = new Date(opts.dueDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const invDate = new Date(opts.invoiceDate).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>${levelLabel} ใบวางบิล ${opts.invoiceNo}</title>
</head>
<body style="font-family: sans-serif; color: #222; max-width: 600px; margin: auto; padding: 20px;">

<p>เรียน ${opts.customerName}</p>

<h2 style="color: #1a4a8a;">${levelLabel} ใบวางบิล #${opts.invoiceNo}</h2>

<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <tr>
    <td style="padding: 8px 0; color: #666;">เลขที่ใบวางบิล</td>
    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${opts.invoiceNo}</td>
  </tr>
  <tr>
    <td style="padding: 8px 0; color: #666;">ลงวันที่</td>
    <td style="padding: 8px 0; text-align: right;">${invDate}</td>
  </tr>
  <tr>
    <td style="padding: 8px 0; color: #666;">มูลค่า</td>
    <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 1.1em;">฿${baht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
  </tr>
  <tr>
    <td style="padding: 8px 0; color: #666;">กำหนดชำระ</td>
    <td style="padding: 8px 0; text-align: right;">${due}</td>
  </tr>
  <tr style="color: #c00;">
    <td style="padding: 8px 0;">เกินกำหนด</td>
    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${opts.daysOverdue} วัน</td>
  </tr>
  <tr style="color: #c00; font-size: 1.2em;">
    <td style="padding: 12px 0 0 0; border-top: 2px solid #c00;">ยอดค้างชำระ</td>
    <td style="padding: 12px 0 0 0; border-top: 2px solid #c00; text-align: right; font-weight: bold;">฿${baht.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
  </tr>
</table>

${opts.bankAccount ? `<p>กรุณาชำระเงินตามบัญชี:<br>${opts.bankAccount}</p>` : ''}

<p style="color: #666; font-size: 0.85em; margin-top: 24px;">
— ส่งจาก ${opts.companyName} ผ่าน Keerati Accounting
</p>
</body>
</html>
  `.trim()
}

// ─── Reminder scheduler ───────────────────────────────────────────────────────

export async function checkOverdueInvoices(): Promise<{
  processed: number
  sent: number
  errors: number
  results: ReminderResult[]
}> {
  const results: ReminderResult[] = []

  // Fetch global reminder settings
  const settings = await prisma.systemSettings.findFirst()
  if (!settings?.reminderEnabled) {
    return { processed: 0, sent: 0, errors: 0, results: [] }
  }

  const { smtpHost, smtpPort, smtpUser, smtpPassword, smtpFromEmail, smtpFromName, reminderDays1, reminderDays2, reminderDays3 } = settings

  if (!smtpHost || !smtpFromEmail) {
    return { processed: 0, sent: 0, errors: 0, results: [] }
  }

  const smtpConfig: SmtpConfig = {
    smtpHost,
    smtpPort,
    smtpUser: smtpUser ?? '',
    smtpPassword: smtpPassword ?? '',
    smtpFromEmail,
    smtpFromName: smtpFromName ?? 'Keerati',
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch company name for email footer
  const company = await prisma.company.findFirst()
  const companyName = company?.name ?? 'บริษัทของท่าน'

  // Fetch overdue, posted, unpaid invoices that have autoReminder = true
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: 'POSTED',
      autoReminder: true,
      dueDate: { not: null },
      dueDate: { lt: today },
      paidAmount: { lt: prisma.invoice.fields.totalAmount }, // unpaid: paidAmount < totalAmount
    },
    include: {
      customer: { select: { name: true, email: true } },
    },
  })

  for (const invoice of overdueInvoices) {
    if (!invoice.customer.email) {
      results.push({ invoiceId: invoice.id, invoiceNo: invoice.invoiceNo, customerName: invoice.customer.name, daysOverdue: 0, level: 1, sent: false, error: 'No customer email' })
      continue
    }

    const daysOverdue = Math.floor((today.getTime() - new Date(invoice.dueDate!).getTime()) / (1000 * 60 * 60 * 24))

    // Determine level
    let level: 1 | 2 | 3 = 1
    if (daysOverdue >= reminderDays3) level = 3
    else if (daysOverdue >= reminderDays2) level = 2
    else if (daysOverdue >= reminderDays1) level = 1
    else continue // not yet at first reminder threshold

    const outstanding = invoice.totalAmount - invoice.paidAmount
    const subject = `[Keerati] ใบวางบิล ${invoice.invoiceNo} ถึงกำหนดชำระ — เกิน ${daysOverdue} วัน`
    const html = buildReminderHtml({
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate.toISOString(),
      dueDate: invoice.dueDate!.toISOString(),
      amount: outstanding,
      daysOverdue,
      level,
      customerName: invoice.customer.name,
      companyName,
    })

    const { success, error } = await sendEmail({
      to: invoice.customer.email,
      subject,
      html,
      smtpConfig,
    })

    if (success) {
      // Log notification
      await prisma.notification.create({
        data: {
          userId: null,
          type: 'OVERDUE_REMINDER',
          title: `ส่ง${reminderLabel(level)}ใบวางบิล ${invoice.invoiceNo}`,
          message: `เกินกำหนด ${daysOverdue} วัน → ส่งอีเมลไปที่ ${invoice.customer.email}`,
          referenceId: invoice.id,
        },
      }).catch(() => {}) // non-blocking
    }

    results.push({
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      customerName: invoice.customer.name,
      daysOverdue,
      level,
      sent: success,
      error,
    })
  }

  return {
    processed: results.length,
    sent: results.filter(r => r.sent).length,
    errors: results.filter(r => !r.sent && r.error).length,
    results,
  }
}
