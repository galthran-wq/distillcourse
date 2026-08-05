import re

# `<corpus>:<path>[#<anchor>]` — the identity the index gives a chunk
# (apps/frontend/lib/content/index-export.ts) and the only content coordinate a
# client is allowed to name. Anything a browser sends is matched against these
# in full: a locator reaches a prompt, a LIKE pattern and a stored row, so the
# grammar is the sanitiser.
LESSON = re.compile(r"lesson:[a-z0-9-]{1,80}/[a-z0-9-]{1,80}")
LESSON_SECTION = re.compile(rf"{LESSON.pattern}(#[a-z0-9-]{{1,80}})?")

# len("lesson:") + the two bounded segments and their separator.
LESSON_LENGTH = 168
