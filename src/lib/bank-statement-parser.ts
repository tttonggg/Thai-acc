/**
 * Bank Statement Parser Service (CAMT.053)
 *
 * Parses CAMT.053 XML bank statement format into structured data.
 * CAMT.053 is a standard ISO 20022 format for bank statement notifications.
 *
 * Format structure:
 * - BkToCstmrStmt > Stmt > Ntry (entries)
 *   - Ntry > Amt (amount)
 *   - Ntry > CdtDbtInd (credit/debit indicator)
 *   - Ntry > BookgDt (booking date)
 *   - Ntry > ValDt (value date)
 *   - Ntry > NtryRef (reference)
 *   - Ntry > AddtlNtryInf (additional info / description)
 */

export interface ParsedBankEntry {
  reference: string | null
  description: string
  amount: number // Satang (integer)
  type: 'CREDIT' | 'DEBIT'
  valueDate: Date
  statementDate: Date
  creditDebitIndicator: 'CRDT' | 'DBIT'
}

export interface ParseResult {
  success: boolean
  entries: ParsedBankEntry[]
  accountId: string | null // IBAN or account number from statement
  statementId: string | null // Statement ID from bank
  error?: string
}

// XML namespaces for CAMT.053
const CAMT053_NAMESPACES = {
  xml: 'xml',
  stmt: 'urn:iso:std:iso:20022:tech:xsd:camt.053.001.02',
}

/**
 * Parse CAMT.053 XML content into structured bank entries
 */
export function parseCamt053Xml(xmlContent: string): ParseResult {
  try {
    // Remove XML declaration and whitespace for easier parsing
    const cleanXml = xmlContent.trim()

    // Extract account identifier (IBAN or account number)
    const accountId = extractXmlValue(cleanXml, 'AcctId') ||
      extractXmlValue(cleanXml, 'Othr > Id') ||
      null

    // Extract statement ID
    const statementId = extractXmlValue(cleanXml, 'Stmt > Id') ||
      extractXmlValue(cleanXml, 'Id') ||
      null

    // Find all Ntry (Entry) elements - entries withinStmt
    const entries: ParsedBankEntry[] = []

    // Split by Ntry tags to find individual entries
    const ntryMatches = cleanXml.match(/<Ntry[^>]*>[\s\S]*?<\/Ntry>/g) || []

    for (const ntryBlock of ntryMatches) {
      const entry = parseNtryBlock(ntryBlock)
      if (entry) {
        entries.push(entry)
      }
    }

    // If no entries found via Ntry tags, try alternative approach
    if (entries.length === 0) {
      // Try finding Amt tags directly
      const amtMatches = cleanXml.match(/<Amt[^>]*>([\d.]+)<\/Amt>/g) || []
      for (const amtBlock of amtMatches) {
        const entry = parseNtryBlockAlt(amtBlock, cleanXml)
        if (entry) {
          entries.push(entry)
        }
      }
    }

    return {
      success: true,
      entries,
      accountId,
      statementId,
    }
  } catch (error: any) {
    return {
      success: false,
      entries: [],
      accountId: null,
      statementId: null,
      error: `Failed to parse CAMT.053: ${error.message}`,
    }
  }
}

/**
 * Extract a value from XML by tag name (simple regex approach)
 */
function extractXmlValue(xml: string, tagName: string): string | null {
  // Handle nested paths like 'AcctId' or 'Othr > Id'
  const parts = tagName.split('>').map(p => p.trim())

  let currentXml = xml
  for (const part of parts) {
    // Match the tag and capture its content
    const match = currentXml.match(new RegExp(`<${part}[^>]*>([^<]*)</${part}>`, 'i'))
    if (match) {
      currentXml = match[1]
    } else {
      // Try self-closing tag
      const selfClosing = currentXml.match(new RegExp(`<${part}[^>]*/>`, 'i'))
      if (selfClosing) {
        return null
      }
      return null
    }
  }
  return currentXml.trim() || null
}

/**
 * Parse a single Ntry (Entry) block
 */
function parseNtryBlock(ntryBlock: string): ParsedBankEntry | null {
  try {
    // Extract amount
    const amtMatch = ntryBlock.match(/<Amt[^>]*>([\d.]+)<\/Amt>/)
    if (!amtMatch) return null
    const amountStr = amtMatch[1]
    const amountFloat = parseFloat(amountStr)
    if (isNaN(amountFloat)) return null

    // Convert to Satang (multiply by 100 and round)
    const amount = Math.round(amountFloat * 100)

    // Extract credit/debit indicator
    const cdtDbtMatch = ntryBlock.match(/<CdtDbtInd>([^<]+)<\/CdtDbtInd>/)
    const creditDebitIndicator = (cdtDbtMatch?.[1] || 'CRDT') as 'CRDT' | 'DBIT'
    const type: 'CREDIT' | 'DEBIT' = creditDebitIndicator === 'CRDT' ? 'CREDIT' : 'DEBIT'

    // Extract booking date (Stmt BookgDt)
    const bookgDtMatch = ntryBlock.match(/<BookgDt>[\s\S]*?<Dt>(\d{4}-\d{2}-\d{2})<\/Dt>[\s\S]*?<\/BookgDt>/)
    const statementDateStr = bookgDtMatch?.[1]
    const statementDate = statementDateStr ? new Date(statementDateStr) : new Date()

    // Extract value date
    const valDtMatch = ntryBlock.match(/<ValDt>[\s\S]*?<Dt>(\d{4}-\d{2}-\d{2})<\/Dt>[\s\S]*?<\/ValDt>/)
    const valueDateStr = valDtMatch?.[1]
    const valueDate = valueDateStr ? new Date(valueDateStr) : new Date()

    // Extract reference
    const refMatch = ntryBlock.match(/<NtryRef>([^<]+)<\/NtryRef>/)
    const reference = refMatch?.[1] || null

    // Extract additional info/description
    const addtlMatch = ntryBlock.match(/<AddtlNtryInf>([^<]+)<\/AddtlNtryInf>/)
    let description = addtlMatch?.[1] || ''

    // If no AddtlNtryInf, try RmtInf (Remittance Information)
    if (!description) {
      const rmtInfMatch = ntryBlock.match(/<RmtInf>[\s\S]*?<Ustrd>([^<]+)<\/Ustrd>[\s\S]*?<\/RmtInf>/)
      description = rmtInfMatch?.[1] || ''
    }

    // If still no description, try EndToEndId
    if (!description) {
      const endToEndMatch = ntryBlock.match(/<EndToEndId>([^<]+)<\/EndToEndId>/)
      description = endToEndMatch?.[1] || ''
    }

    if (!description) {
      description = 'No description'
    }

    return {
      reference,
      description: description.trim(),
      amount,
      type,
      valueDate,
      statementDate,
      creditDebitIndicator,
    }
  } catch {
    return null
  }
}

/**
 * Alternative parsing for simpler/minimal CAMT files
 */
function parseNtryBlockAlt(amtBlock: string, fullXml: string): ParsedBankEntry | null {
  try {
    const amtMatch = amtBlock.match(/<Amt[^>]*>([\d.]+)<\/Amt>/)
    if (!amtMatch) return null

    const amountFloat = parseFloat(amtMatch[1])
    if (isNaN(amountFloat)) return null
    const amount = Math.round(amountFloat * 100)

    // Find adjacent CdtDbtInd
    const cdtDbtMatch = fullXml.match(/<CdtDbtInd>([^<]+)<\/CdtDbtInd>/)
    const creditDebitIndicator = (cdtDbtMatch?.[1] || 'CRDT') as 'CRDT' | 'DBIT'
    const type: 'CREDIT' | 'DEBIT' = creditDebitIndicator === 'CRDT' ? 'CREDIT' : 'DEBIT'

    // Find dates - use first occurrence
    const dateMatch = fullXml.match(/<Dt>(\d{4}-\d{2}-\d{2})<\/Dt>/)
    const dateStr = dateMatch?.[1]
    const date = dateStr ? new Date(dateStr) : new Date()

    return {
      reference: null,
      description: 'Parsed from CAMT file',
      amount,
      type,
      valueDate: date,
      statementDate: date,
      creditDebitIndicator,
    }
  } catch {
    return null
  }
}

/**
 * Parse CAMT.053 from JSON (in case of pre-parsed format)
 * Some APIs return pre-parsed CAMT data as JSON
 */
export function parseCamt053Json(data: {
  accountId?: string
  statementId?: string
  entries: Array<{
    reference?: string
    description?: string
    amount: number // Expected in Baht or Satang
    type: 'CREDIT' | 'DEBIT' | 'CRDT' | 'DBIT'
    valueDate?: string | Date
    statementDate?: string | Date
    amountUnit?: 'BAHT' | 'SATANG'
  }>
}): ParseResult {
  try {
    const entries: ParsedBankEntry[] = data.entries.map(entry => {
      // Convert amount to Satang if in Baht
      let amount = entry.amount
      if (entry.amountUnit === 'BAHT' || !entry.amountUnit) {
        // Assume Baht if not specified (common API convention)
        amount = Math.round(entry.amount * 100)
      }

      // Normalize type
      let type: 'CREDIT' | 'DEBIT'
      if (entry.type === 'CREDIT' || entry.type === 'CRDT') {
        type = 'CREDIT'
      } else {
        type = 'DEBIT'
      }

      return {
        reference: entry.reference || null,
        description: entry.description || 'No description',
        amount,
        type,
        valueDate: entry.valueDate ? new Date(entry.valueDate) : new Date(),
        statementDate: entry.statementDate ? new Date(entry.statementDate) : new Date(),
        creditDebitIndicator: type === 'CREDIT' ? 'CRDT' as const : 'DBIT' as const,
      }
    })

    return {
      success: true,
      entries,
      accountId: data.accountId || null,
      statementId: data.statementId || null,
    }
  } catch (error: any) {
    return {
      success: false,
      entries: [],
      accountId: null,
      statementId: null,
      error: `Failed to parse CAMT JSON: ${error.message}`,
    }
  }
}

/**
 * Validate that content appears to be CAMT.053 format
 */
export function isCamt053Content(content: string): boolean {
  const trimmed = content.trim()
  // Check for CAMT.053 indicators
  return trimmed.includes('camt.053') ||
    trimmed.includes('BkToCstmrStmt') ||
    trimmed.includes('urn:iso:std:iso:20022:tech:xsd:camt') ||
    (trimmed.includes('<Ntry>') && trimmed.includes('<Amt>'))
}
