import csv
import io
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from ..models.bank_statement_import import BankStatementImport
from ..models.bank_statement_line import BankStatementLine
from ..models.gl import JournalEntry, JournalEntryLine


class ParsedLine:
    def __init__(self, transaction_date: date, description: str, debit: Decimal, credit: Decimal, reference: str = ""):
        self.transaction_date = transaction_date
        self.description = description
        self.debit = debit
        self.credit = credit
        self.reference = reference


class BankStatementParser:
    """Parse Thai bank statement CSV files."""

    BANK_FORMATS = {
        "kbank": {
            "headers": ["วันที่", "รายการ", "ถอน", "ฝาก", "คงเหลือ"],
            "date_col": 0,
            "desc_col": 1,
            "debit_col": 2,
            "credit_col": 3,
            "date_format": "%d/%m/%Y",
        },
        "scb": {
            "headers": ["transaction date", "description", "debit", "credit", "balance"],
            "date_col": 0,
            "desc_col": 1,
            "debit_col": 2,
            "credit_col": 3,
            "date_format": "%Y-%m-%d",
        },
        "bbl": {
            "headers": ["date", "transaction details", "debit amount", "credit amount", "balance"],
            "date_col": 0,
            "desc_col": 1,
            "debit_col": 2,
            "credit_col": 3,
            "date_format": "%d/%m/%Y",
        },
        "generic": {
            "headers": ["date", "description", "debit", "credit"],
            "date_col": 0,
            "desc_col": 1,
            "debit_col": 2,
            "credit_col": 3,
            "date_format": "%Y-%m-%d",
        },
    }

    @staticmethod
    def _normalize_amount(value: str) -> Decimal:
        if not value or value.strip() in ("", "-", "--"):
            return Decimal("0")
        # Remove commas, spaces, quotes
        cleaned = value.replace(",", "").replace(" ", "").replace('"', "").replace("'", "")
        # Handle parentheses for negative: (100.00) → -100.00
        if cleaned.startswith("(") and cleaned.endswith(")"):
            cleaned = "-" + cleaned[1:-1]
        try:
            return Decimal(cleaned)
        except InvalidOperation:
            return Decimal("0")

    @staticmethod
    def _parse_date(value: str, fmt: str) -> Optional[date]:
        value = value.strip()
        if not value:
            return None
        for f in [fmt, "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"]:
            try:
                return datetime.strptime(value, f).date()
            except ValueError:
                continue
        return None

    @staticmethod
    def _detect_format(headers: List[str]) -> str:
        headers_lower = [h.strip().lower() for h in headers]
        for bank, config in BankStatementParser.BANK_FORMATS.items():
            config_headers = [h.lower() for h in config["headers"]]
            # Check if at least 3 headers match
            matches = sum(1 for h in config_headers if h in headers_lower)
            if matches >= 3:
                return bank
        return "generic"

    @classmethod
    def parse_csv(cls, file_content: bytes, filename: str = "") -> List[ParsedLine]:
        """Parse CSV content and return list of parsed lines."""
        # Try UTF-8 first, then fallback to TIS-620 (common in Thai banks)
        try:
            text = file_content.decode("utf-8-sig")  # Handles BOM
        except UnicodeDecodeError:
            text = file_content.decode("tis-620")

        reader = csv.reader(io.StringIO(text))
        rows = list(reader)

        if not rows:
            return []

        # Detect format from headers (first row)
        headers = rows[0]
        bank_format = cls._detect_format(headers)
        config = cls.BANK_FORMATS[bank_format]

        # Skip header row
        data_rows = rows[1:]

        # Skip footer/summary rows (usually last row has "ยอดคงเหลือ" or balance)
        filtered_rows = []
        for row in data_rows:
            if not row or all(cell.strip() == "" for cell in row):
                continue
            # Skip rows that look like totals/summaries
            first_col = row[0].strip().lower() if row else ""
            if any(k in first_col for k in ["ยอด", "total", "balance", "สรุป", "summary"]):
                continue
            filtered_rows.append(row)

        results = []
        for row in filtered_rows:
            try:
                date_val = cls._parse_date(row[config["date_col"]], config["date_format"])
                if not date_val:
                    continue

                desc = row[config["desc_col"]].strip() if len(row) > config["desc_col"] else ""
                debit = cls._normalize_amount(row[config["debit_col"]]) if len(row) > config["debit_col"] else Decimal("0")
                credit = cls._normalize_amount(row[config["credit_col"]]) if len(row) > config["credit_col"] else Decimal("0")
                ref = ""

                results.append(ParsedLine(
                    transaction_date=date_val,
                    description=desc,
                    debit=debit,
                    credit=credit,
                    reference=ref,
                ))
            except (IndexError, ValueError):
                continue

        return results


class BankStatementMatcher:
    """Match bank statement lines to journal entry lines."""

    @staticmethod
    def find_matches(
        stmt_line: BankStatementLine,
        je_lines: List[JournalEntryLine],
        days_tolerance: int = 3
    ) -> List[Tuple[JournalEntryLine, float]]:
        """Find candidate JE lines that match the statement line."""
        candidates = []
        stmt_net = float(stmt_line.debit_amount or 0) - float(stmt_line.credit_amount or 0)

        for je_line in je_lines:
            je_entry = je_line.journal_entry
            if not je_entry:
                continue

            # Date match (within tolerance)
            date_diff = abs((stmt_line.transaction_date - je_entry.entry_date).days)
            if date_diff > days_tolerance:
                continue

            # Amount match
            je_net = float(je_line.debit_amount or 0) - float(je_line.credit_amount or 0)
            if abs(stmt_net - je_net) > 0.01:
                continue

            # Score: 1.0 for exact date, decreasing by date difference
            score = 1.0 - (date_diff / days_tolerance) * 0.3
            candidates.append((je_line, score))

        # Sort by score descending
        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[:5]


class BankStatementImportService:
    """Service for processing bank statement imports."""

    @staticmethod
    def process_import(
        bank_account_id: UUID,
        file_content: bytes,
        file_name: str,
        db: Session,
        company_id: UUID,
        created_by: Optional[UUID] = None,
    ) -> BankStatementImport:
        """Parse a CSV file and create import record with lines."""
        import_record = BankStatementImport(
            company_id=company_id,
            bank_account_id=bank_account_id,
            file_name=file_name,
            status="processing",
            created_by=created_by,
        )
        db.add(import_record)
        db.flush()  # Get the ID

        try:
            parsed_lines = BankStatementParser.parse_csv(file_content, file_name)

            total_debit = Decimal("0")
            total_credit = Decimal("0")
            min_date = None
            max_date = None

            for pl in parsed_lines:
                line = BankStatementLine(
                    import_id=import_record.id,
                    transaction_date=pl.transaction_date,
                    description=pl.description,
                    reference_number=pl.reference,
                    debit_amount=pl.debit,
                    credit_amount=pl.credit,
                    is_matched="N",
                )
                db.add(line)
                total_debit += pl.debit
                total_credit += pl.credit

                if min_date is None or pl.transaction_date < min_date:
                    min_date = pl.transaction_date
                if max_date is None or pl.transaction_date > max_date:
                    max_date = pl.transaction_date

            import_record.total_debit = total_debit
            import_record.total_credit = total_credit
            import_record.statement_date_from = min_date
            import_record.statement_date_to = max_date
            import_record.status = "completed"

            db.commit()
            db.refresh(import_record)
            return import_record

        except Exception as e:
            import_record.status = "failed"
            import_record.error_message = str(e)
            db.commit()
            raise

    @staticmethod
    def suggest_matches(
        import_id: UUID,
        db: Session,
        company_id: UUID,
    ) -> List[dict]:
        """Get match suggestions for all unmatched lines in an import."""
        import_record = db.query(BankStatementImport).filter(
            BankStatementImport.id == import_id,
            BankStatementImport.company_id == company_id,
            BankStatementImport.deleted_at.is_(None),
        ).first()

        if not import_record or not import_record.bank_account_id:
            return []

        # Get unmatched lines
        stmt_lines = db.query(BankStatementLine).filter(
            BankStatementLine.import_id == import_id,
            BankStatementLine.is_matched == "N",
            BankStatementLine.deleted_at.is_(None),
        ).all()

        if not stmt_lines:
            return []

        # Get unreconciled JE lines for this bank account's GL account
        bank_account = import_record.bank_account
        if not bank_account or not bank_account.gl_account_id:
            return []

        je_lines = db.query(JournalEntryLine).join(JournalEntry).filter(
            JournalEntryLine.account_id == bank_account.gl_account_id,
            JournalEntry.company_id == company_id,
            JournalEntry.status == "posted",
            JournalEntryLine.is_reconciled == "N",
        ).all()

        results = []
        for stmt_line in stmt_lines:
            matches = BankStatementMatcher.find_matches(stmt_line, je_lines)
            suggestions = []
            for je_line, score in matches:
                je = je_line.journal_entry
                suggestions.append({
                    "je_line_id": str(je_line.id),
                    "entry_date": je.entry_date.isoformat() if je else None,
                    "description": je_line.description or (je.description if je else None),
                    "document_number": je.document_number if je else None,
                    "debit_amount": str(je_line.debit_amount),
                    "credit_amount": str(je_line.credit_amount),
                    "score": round(score, 2),
                })

            results.append({
                "line_id": str(stmt_line.id),
                "transaction_date": stmt_line.transaction_date.isoformat(),
                "description": stmt_line.description,
                "debit_amount": str(stmt_line.debit_amount),
                "credit_amount": str(stmt_line.credit_amount),
                "suggested_matches": suggestions,
            })

        return results

    @staticmethod
    def match_line(
        line_id: UUID,
        je_line_id: Optional[UUID],
        db: Session,
        company_id: UUID,
    ) -> BankStatementLine:
        """Match or unmatch a statement line to a JE line."""
        stmt_line = db.query(BankStatementLine).join(BankStatementImport).filter(
            BankStatementLine.id == line_id,
            BankStatementImport.company_id == company_id,
            BankStatementLine.deleted_at.is_(None),
        ).first()

        if not stmt_line:
            raise ValueError("Statement line not found")

        # If previously matched, unreconcile the old JE line
        if stmt_line.matched_je_line_id and stmt_line.matched_je_line_id != je_line_id:
            old_je = db.query(JournalEntryLine).filter(
                JournalEntryLine.id == stmt_line.matched_je_line_id,
            ).first()
            if old_je:
                old_je.is_reconciled = "N"
                old_je.reconciled_at = None
                old_je.reconciled_by = None

        if je_line_id:
            je_line = db.query(JournalEntryLine).filter(
                JournalEntryLine.id == je_line_id,
            ).first()
            if not je_line:
                raise ValueError("Journal entry line not found")

            stmt_line.is_matched = "Y"
            stmt_line.matched_je_line_id = je_line_id
            stmt_line.match_score = Decimal("1.00")

            je_line.is_reconciled = "Y"
            je_line.reconciled_at = date.today()
        else:
            stmt_line.is_matched = "N"
            stmt_line.matched_je_line_id = None
            stmt_line.match_score = None

        db.commit()
        db.refresh(stmt_line)
        return stmt_line

    @staticmethod
    def delete_import(
        import_id: UUID,
        db: Session,
        company_id: UUID,
    ) -> None:
        """Soft delete a statement import and all its lines."""
        import_record = db.query(BankStatementImport).filter(
            BankStatementImport.id == import_id,
            BankStatementImport.company_id == company_id,
            BankStatementImport.deleted_at.is_(None),
        ).first()

        if not import_record:
            raise ValueError("Import not found")

        now = datetime.utcnow()

        # Unreconcile any matched JE lines first
        for line in import_record.lines:
            if line.matched_je_line_id:
                je_line = db.query(JournalEntryLine).filter(
                    JournalEntryLine.id == line.matched_je_line_id,
                ).first()
                if je_line:
                    je_line.is_reconciled = "N"
                    je_line.reconciled_at = None
                    je_line.reconciled_by = None
            line.deleted_at = now

        import_record.deleted_at = now
        db.commit()
