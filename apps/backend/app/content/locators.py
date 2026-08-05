import re

# `<corpus>:<path>[#<anchor>]` — the identity the index gives a chunk
# (apps/frontend/lib/content/index-export.ts) and the only content coordinate a
# client is allowed to name. Anything a browser sends is matched against these
# in full: a locator reaches a prompt, a LIKE pattern and a stored row, so the
# grammar is the sanitiser.
SEGMENT = 80
LESSON = re.compile(rf"lesson:[a-z0-9-]{{1,{SEGMENT}}}/[a-z0-9-]{{1,{SEGMENT}}}")
LESSON_SECTION = re.compile(rf"{LESSON.pattern}(#[a-z0-9-]{{1,{SEGMENT}}})?")

# Derived from the same bound the pattern uses, because widening a segment
# there without widening the columns that store a locator would only show up
# as a DataError on the longest ones: len("lesson:") + the two segments and
# their separator.
LESSON_LENGTH = len("lesson:") + 2 * SEGMENT + 1
