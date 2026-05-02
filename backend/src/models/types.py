"""Cross-database UUID type that works with PostgreSQL and SQLite."""
from uuid import UUID
from sqlalchemy import TypeDecorator, String


class CrossPlatformUUID(TypeDecorator):
    """UUID type that handles both PostgreSQL and SQLite.
    
    On PostgreSQL: uses native UUID type
    On SQLite: uses VARCHAR(36) and handles string/UUID conversion
    """
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import UUID as PGUUID
            return dialect.type_descriptor(PGUUID(as_uuid=True))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UUID):
            return str(value)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UUID):
            return value
        return UUID(value)
