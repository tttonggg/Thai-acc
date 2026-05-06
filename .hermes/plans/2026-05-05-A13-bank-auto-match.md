## A13: Bank Auto-Match Engine — Algorithm
**Spec file:** `.hermes/plans/2026-05-05-A13-bank-auto-match.md`
**Dev Cycle:** /spec → /plan → /build → /test → /review → /simplify → /ship
**Depends on:** T0
**Partial:** `src/app/api/bank-accounts/[id]/reconcile/route.ts` exists, auto-match algorithm missing

---

## What
Build an algorithm that automatically matches bank statement lines to invoices/payments. User uploads bank CSV → system auto-matches to existing documents with confidence score → user approves or rejects matches.

---

## Step 1: /spec

### Current State
- Bank reconciliation UI exists: `banking-page.tsx`, `bank-matching.tsx`
- Manual matching: user clicks each bank line → links to document
- No auto-match algorithm

### Target: Auto-Match Algorithm

**Input:** Bank statement line (date, amount, description)
**Output:** List of candidate document matches with confidence scores

**Matching Logic:**

```
1. EXACT MATCH (100% confidence):
   - amount = invoice.totalAmount
   - date within ±3 days of invoice due date

2. FUZZY MATCH (60-95% confidence):
   - amount within 1% of invoice amount
   - date within ±7 days
   - description contains invoice number

3. PARTIAL MATCH (30-60% confidence):
   - amount within 5% of invoice
   - date within ±14 days
   - no invoice number in description

4. NO MATCH (0%):
   - amount not found in any document
```

### Auto-Match Flow
```
1. User uploads bank CSV
2. System parses: date, amount, description, balance
3. For each bank line:
   a. Find matching documents by amount (Satang)
   b. Score by date proximity and description match
   c. Return top candidates
4. User reviews: approves or rejects each match
5. On approve: link bank line → document
6. Run reconciliation: bank balance = GL balance
```

### Confidence Score Display
| Score | Label | Color |
|-------|-------|-------|
| 100% | แม่นยำ (Exact) | 🟢 Green |
| 80-99% | สูง (High) | 🟢 Green |
| 60-79% | ปานกลาง (Medium) | 🟡 Yellow |
| 30-59% | ต่ำ (Low) | 🟠 Orange |
| <30% | ไม่แน่นอน (Uncertain) | 🔴 Red |

---

## Step 2: /plan

### Tasks
1. Check existing reconcile API:
```bash
cat src/app/api/bank-accounts/[id]/reconcile/route.ts
cat src/app/api/banking/match/route.ts
```

2. Create auto-match algorithm in service:
   - `src/lib/bank-auto-match-service.ts` — core matching logic

3. Create bank statement parser:
   - `src/lib/bank-statement-parser.ts` — parse CSV to structured data
   - Support formats: BBL, KBANK, SCB, Krungsri, TMB

4. Create/extend API:
   - `POST /api/banking/auto-match` — run auto-match algorithm
   - `POST /api/banking/match-decision` — user approves/rejects

5. Update bank-matching UI to show confidence scores and auto-matched items

### Files
```
src/lib/bank-auto-match-service.ts   # NEW - core algorithm
src/lib/bank-statement-parser.ts     # NEW - CSV parser
src/app/api/banking/auto-match/route.ts   # NEW
src/app/api/banking/match-decision/route.ts # NEW
src/components/banking/bank-matching.tsx   # update: show scores
```

### Thai ERP Checklist
- [ ] All amounts in Satang (compare Satang to Satang)
- [ ] Debit=credit (N/A for matching)
- [ ] Period check (N/A)
- [ ] Prisma transaction (wrap match decisions in transaction)

---

## Step 3: /build

Create bank-auto-match-service.ts with the matching algorithm.

### Algorithm Pseudocode
```typescript
async function autoMatchBankLine(bankLine: BankStatementLine): Promise<Match[]> {
  // 1. Find candidates by exact amount
  const exactMatches = await findByExactAmount(bankLine.amount);
  
  // 2. Score each by date proximity
  const scored = exactMatches.map(doc => ({
    doc,
    score: calculateScore(bankLine, doc),
    reasons: []
  }));
  
  // 3. Sort by score descending
  return scored.sort((a, b) => b.score - a.score);
}

function calculateScore(bankLine: BankLine, doc: Document): number {
  let score = 0;
  
  // Amount exact: +50
  if (bankLine.amount === doc.amount) score += 50;
  // Amount within 1%: +40
  else if (within1Percent()) score += 40;
  // Amount within 5%: +20
  else if (within5Percent()) score += 20;
  
  // Date exact: +30
  // Date within 3 days: +20
  // Date within 7 days: +10
  
  // Description contains invoice ref: +20
  
  return Math.min(score, 100);
}
```

---

## Step 4: /test

Manual:
1. Upload bank CSV from BBL (test file provided)
2. System auto-matches 15/20 lines
3. User reviews matches — approves/rejects
4. System links approved matches
5. Reconciliation status updates

```bash
bun run tsc --noEmit
```

---

## Step 5: /review

- [ ] Algorithm correctly identifies exact matches
- [ ] Fuzzy matching provides reasonable candidates
- [ ] Confidence scores display correctly
- [ ] User can approve/reject matches
- [ ] CSV parser handles major Thai bank formats
- [ ] Performance: 100 bank lines < 5 seconds

---

## Step 6: /ship

```bash
git add src/lib/bank-auto-match-service.ts src/lib/bank-statement-parser.ts
git add src/app/api/banking/auto-match/ src/app/api/banking/match-decision/
git add src/components/banking/
git commit -m "feat(A13): add bank auto-match engine

- Algorithm matches bank statement lines to invoices/payments
- Confidence scoring: exact (100%), high (80-99%), medium (60-79%), low (<60%)
- CSV parser for major Thai banks (BBL, KBANK, SCB, etc.)
- User reviews matches before linking
- Drastically reduces manual bank reconciliation time
"
```
