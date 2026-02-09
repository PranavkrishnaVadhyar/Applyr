import uuid
from sqlalchemy import (
    Column,
    Text,
    String,
    Date,
    DateTime,
    ForeignKey,
    JSON,
    func,
    CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base


class Application(Base):
    __tablename__ = "applications"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    # Ownership
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="cascade"),
        nullable=False,
        index=True
    )

    # Resume may not exist at creation time
    resume_id = Column(
        UUID(as_uuid=True),
        ForeignKey("resumes.id", ondelete="set null"),
        nullable=True,
        index=True
    )

    # Extracted fields (LLM)
    job_role = Column(Text, nullable=False)
    job_description = Column(Text, nullable=False)
    company_name = Column(Text, nullable=False)
    company_description = Column(Text, nullable=True)

    # Deadlines
    final_date = Column(Date, nullable=True)

    # LLM / automation response (future use)
    response = Column(JSON, nullable=True)

    # Status lifecycle
    status = Column(
        String,
        nullable=False,
        default="draft"
    )

    # Timestamps
    applied_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    __table_args__ = (
        CheckConstraint(
            "status NOT IN ('applied', 'screened', 'interviewed', 'selected', 'rejected') OR resume_id IS NOT NULL",
            name="resume_required_for_applied"
        ),
    )
