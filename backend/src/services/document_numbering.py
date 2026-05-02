from datetime import datetime
from sqlalchemy.orm import Session
from ..models.document_sequence import DocumentSequence


class DocumentNumberingService:
    def __init__(self, db: Session, company_id: str):
        self.db = db
        self.company_id = company_id

    def get_next_number(self, doc_type: str, prefix: str) -> str:
        """Get next sequential document number."""
        year = datetime.now().year

        # Get or create sequence record
        seq = self.db.query(DocumentSequence).filter(
            DocumentSequence.company_id == self.company_id,
            DocumentSequence.year == year,
            DocumentSequence.doc_type == doc_type
        ).first()

        if not seq:
            seq = DocumentSequence(
                company_id=self.company_id,
                year=year,
                doc_type=doc_type,
                prefix=prefix,
                last_number=0
            )
            self.db.add(seq)

        seq.get_next_number()
        self.db.commit()
        return seq.format_number()
