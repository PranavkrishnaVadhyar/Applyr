import uuid
from sqlalchemy import (
    Column,
    Text,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    ARRAY,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Linked with Supabase auth.users
    email = Column(
        Text,
        nullable=False,
        unique=True,
        index=True
    )

    first_name = Column(
        Text,
        nullable=True
    )

    last_name = Column(
        Text,
        nullable=True
    )

    role = Column(
        String,
        nullable=True,
        default="user"
    )

    active = Column(
        Boolean,
        nullable=False,
        default=True
    )

    # Profile Details
    phone_number = Column(
        Text,
        nullable=True
    )

    location = Column(
        Text,
        nullable=True
    )

    headline = Column(
        Text,
        nullable=True
    )

    bio = Column(
        Text,
        nullable=True
    )

    skills = Column(
        ARRAY(Text),
        nullable=True
    )

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )