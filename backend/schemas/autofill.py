from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class FormField(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=100)
    label: str = Field(max_length=500)
    type: Literal["text", "email", "tel", "url", "textarea", "select-one"] = "text"
    options: list[str] = Field(default_factory=list, max_length=200)
    has_value: bool = False

    @model_validator(mode="after")
    def bounded_options(self):
        if any(len(option) > 300 for option in self.options):
            raise ValueError("Option too long")
        return self


class ResolveRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    resume_id: UUID
    fields: list[FormField] = Field(min_length=1, max_length=50)
    generate_drafts: bool = False

    @model_validator(mode="after")
    def unique_ids(self):
        if len({field.id for field in self.fields}) != len(self.fields):
            raise ValueError("Field IDs must be unique")
        return self


class Evidence(BaseModel):
    id: str
    text: str


class Resolution(BaseModel):
    field_id: str
    value: str | None = None
    status: Literal["suggested", "draft", "unresolved", "skipped"]
    reason: str
    needs_review: bool = True
    evidence: list[Evidence] = Field(default_factory=list)


class ResolveResponse(BaseModel):
    resume_id: UUID
    results: list[Resolution]
