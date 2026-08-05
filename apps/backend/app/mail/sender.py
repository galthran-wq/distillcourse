import logging
from pathlib import Path
from typing import Any

from emails.message import Message
from jinja2 import Template

from app.core.config import settings

logger = logging.getLogger(__name__)

TEMPLATES = Path(__file__).parent / "templates"


def render(template_name: str, context: dict[str, Any]) -> str:
    template: Template = Template((TEMPLATES / template_name).read_text())
    return template.render(context)


def send(*, email_to: str, subject: str, html_content: str) -> None:
    sender = settings.EMAILS_FROM_EMAIL
    if not settings.SMTP_HOST or not sender:
        raise RuntimeError("SMTP_HOST and EMAILS_FROM_EMAIL must be set to send mail")
    message = Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, sender),
    )
    smtp: dict[str, Any] = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp["tls"] = True
    elif settings.SMTP_SSL:
        smtp["ssl"] = True
    if settings.SMTP_USER:
        smtp["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp["password"] = settings.SMTP_PASSWORD
    logger.info("sent mail to %s: %s", email_to, message.send(to=email_to, smtp=smtp))
