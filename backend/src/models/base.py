from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, event
from .types import CrossPlatformUUID as UUID
from ..core.database import Base


class BaseModel(Base):
    """Abstract base model with audit trail fields."""
    __abstract__ = True

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


# Auto-update updated_at on every flush
@event.listens_for(BaseModel, "before_update", propagate=True)
def receive_before_update(mapper, connection, target):
    target.updated_at = datetime.utcnow()
