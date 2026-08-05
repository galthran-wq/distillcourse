from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

# Bumped in lockstep with INDEX_SCHEMA_VERSION in
# apps/frontend/lib/content/index-export.ts, which produces these files.
INDEX_SCHEMA_VERSION = 1


class IndexDocument(BaseModel):
    """One chunk of content as exported by the frontend."""

    corpus: Annotated[str, Field(max_length=16)]
    course_slug: Annotated[str | None, Field(max_length=64)] = None
    locator: Annotated[str, Field(max_length=512)]
    title: str
    breadcrumb: str
    text: str
    anchors: list[str] = []
    position: int
    metadata: dict[str, Any] = {}


class ContentIndex(BaseModel):
    schema_version: Literal[1]
    documents: list[IndexDocument]
