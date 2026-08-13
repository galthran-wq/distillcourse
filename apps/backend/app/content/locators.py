import re

# One bound on a slug for the whole service: the grammar below, the path
# parameters of the lesson routes and `documents.course_slug` are all this
# number, so a course cannot be ratable while being too long to index.
SLUG_LENGTH = 80
SLUG = rf"[a-z0-9-]{{1,{SLUG_LENGTH}}}"

# Kebab-case, anchored: the shape anything a client or a model *writes* must
# have, as opposed to SLUG above, which matches a segment of an already-stored
# locator inside a larger pattern. Every route path parameter and every tool
# argument that takes a slug is this one expression, so the grammar cannot
# drift between the two ends of the same value.
SLUG_PATTERN = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"

# An anchor is not a slug: it is whatever the site's rehype-slug wrote for a
# heading, so it keeps the alphabet that heading was written in and is longer
# than a slug is allowed to be — the same reason a telemetry target is matched
# as word characters rather than ASCII (app/telemetry/schemas.py). Only `#` and
# whitespace are excluded, which is what keeps an anchor one prompt token.
ANCHOR_LENGTH = 200
ANCHOR = rf"[^\s#]{{1,{ANCHOR_LENGTH}}}"

# `<corpus>:<path>[#<anchor>]` — the identity the index gives a chunk
# (apps/frontend/lib/content/locator.ts) and the only content coordinate a
# client is allowed to name. Anything a browser sends is matched against these
# in full: a locator reaches a prompt, a LIKE pattern and a stored row, so the
# grammar is the sanitiser. Only LESSON is ever stored, so only it is bounded
# by SLUG_LENGTH below.
LESSON = re.compile(rf"lesson:{SLUG}/{SLUG}")
LESSON_SECTION = re.compile(rf"{LESSON.pattern}(#{ANCHOR})?")

# Derived from the same bound the pattern uses, because widening a segment
# there without widening the columns that store a locator would only show up
# as a DataError on the longest ones: len("lesson:") + the two bounded segments
# and their separator.
LESSON_LENGTH = len("lesson:") + 2 * SLUG_LENGTH + 1

# The other half of a lab checkpoint's identity, after the lesson locator: a
# kebab-case id from the lesson's `challenges.yaml`. Its own bound rather than
# SLUG_LENGTH, because it is read in a notebook cell beside the code it checks
# and never appears in a path.
CHECKPOINT_LENGTH = 64


def lesson_key(course: str, lesson: str) -> str:
    """The locator the index gives a lesson — the one string telemetry,
    ratings, the review ladder and lab checkpoints all file a lesson under."""
    return f"lesson:{course}/{lesson}"


def course_of(locator: str) -> str:
    """The course a locator belongs to. `<corpus>:<course>[/<rest>]`.

    Every corpus is filed under a course, so this answers for a lesson, a
    research brief, a concept and the course row itself alike.
    """
    return locator.partition(":")[2].partition("/")[0]
