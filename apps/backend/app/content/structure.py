from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Document

# The spine and the concept definitions are documents like any other: the
# service still learns everything it knows about a course from the index.
COURSE_CORPUS = "course"
CONCEPT_CORPUS = "concept"


class LessonEntry(BaseModel):
    slug: str
    locator: str
    title: str
    type: str
    est_minutes: int
    prerequisites: list[str] = []
    introduces: list[str] = []
    reinforces: list[str] = []


class ModuleEntry(BaseModel):
    slug: str
    title: str
    lessons: list[LessonEntry]


class Spine(BaseModel):
    """`documents.metadata` of a `course:` row, as export-index writes it."""

    tagline: str
    modules: list[ModuleEntry]


class ConceptEntry(BaseModel):
    id: str
    name: str
    definition: str
    introduced_in: str


class CourseStructure(BaseModel):
    course: str
    title: str
    tagline: str
    modules: list[ModuleEntry]
    concepts: list[ConceptEntry]


def reading_order(course: CourseStructure) -> list[LessonEntry]:
    """Every lesson of a course, in the order it is read. The spine is stored
    as modules, and most questions about it — which lesson is this, what comes
    next to it — are about that flat order."""
    return [lesson for module in course.modules for lesson in module.lessons]


def module_of(course: CourseStructure, lesson: LessonEntry) -> ModuleEntry | None:
    return next((module for module in course.modules if lesson in module.lessons), None)


def _concept(document: Document) -> ConceptEntry:
    return ConceptEntry(
        id=document.locator.rpartition("/")[2],
        name=document.title,
        definition=document.text,
        introduced_in=str(document.meta.get("introduced_in", "")),
    )


async def structure(
    session: AsyncSession, course_slug: str | None = None
) -> list[CourseStructure]:
    """The spine of one course, or of every course the index carries.

    Only the lessons the site renders are in the index, so a course reads here
    exactly as long as it reads on the site — a planned lesson is no more
    visible to the tutor than to the learner.
    """
    statement = select(Document).where(
        Document.corpus.in_([COURSE_CORPUS, CONCEPT_CORPUS])
    )
    if course_slug is not None:
        statement = statement.where(Document.course_slug == course_slug)
    documents = (await session.scalars(statement.order_by(Document.position))).all()

    concepts: dict[str | None, list[ConceptEntry]] = {}
    for document in documents:
        if document.corpus == CONCEPT_CORPUS:
            concepts.setdefault(document.course_slug, []).append(_concept(document))

    courses = []
    for document in documents:
        if document.corpus != COURSE_CORPUS:
            continue
        spine = Spine.model_validate(document.meta)
        courses.append(
            CourseStructure(
                course=document.locator.partition(":")[2],
                title=document.title,
                tagline=spine.tagline,
                modules=spine.modules,
                concepts=concepts.get(document.course_slug, []),
            )
        )
    return courses
