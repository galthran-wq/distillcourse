from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

from app.content.locators import SLUG_LENGTH


class IndexDocument(BaseModel):
    """One chunk of content as exported by the frontend."""

    corpus: Annotated[str, Field(max_length=16)]
    # One bound for a slug across the service: the grammar, the column that
    # stores it and this schema. Narrower here and the ingest of a long but
    # legal slug fails validation; wider and it fails on the INSERT.
    course_slug: Annotated[str | None, Field(max_length=SLUG_LENGTH)] = None
    locator: Annotated[str, Field(max_length=512)]
    title: str
    breadcrumb: str
    text: str
    anchors: list[str] = []
    position: int
    metadata: dict[str, Any] = {}


class ContentIndex(BaseModel):
    # The Literal is the version check: an index written by a newer exporter is
    # rejected here rather than half-ingested. Bump it in the same commit that
    # bumps INDEX_SCHEMA_VERSION in apps/frontend/lib/content/index-export.ts.
    schema_version: Literal[1]
    documents: list[IndexDocument]
