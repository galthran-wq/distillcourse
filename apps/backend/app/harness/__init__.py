# Registering a tool is a side effect of defining it, so the module has to be
# imported for the agent to have any tools at all. Nothing else imports it.
from app.harness import tools as tools  # noqa: F401
