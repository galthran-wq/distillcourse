import warnings
from typing import Annotated, Any, Literal, Self

from pydantic import (
    AnyUrl,
    BaseModel,
    BeforeValidator,
    PostgresDsn,
    computed_field,
    model_validator,
)
from pydantic_settings import BaseSettings, SettingsConfigDict


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    if isinstance(v, list | str):
        return v
    raise ValueError(v)


class ChatModel(BaseModel):
    openrouter_id: str
    display_name: str
    context_window: int


class Settings(BaseSettings):
    # No env_file: compose hands the repo-root .env to the container, and a
    # host-run process gets the defaults below or `uv run --env-file ../../.env`.
    model_config = SettingsConfigDict(env_ignore_empty=True, extra="ignore")

    PROJECT_NAME: str = "distillcourse"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: Literal["local", "staging", "production"] = "local"
    FRONTEND_HOST: str = "http://localhost:3000"

    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "distillcourse"

    # Signup is invite-only: without billing or email verification an open
    # registration turns the tutor harness into a free LLM proxy.
    INVITE_CODE: str = "local-invite"

    LOGFIRE_TOKEN: str | None = None

    OPENROUTER_API_KEY: str | None = None
    CHAT_MODELS: list[ChatModel] = [
        ChatModel(
            openrouter_id="moonshotai/kimi-k3",
            display_name="Kimi K3",
            context_window=1_048_576,
        ),
        ChatModel(
            openrouter_id="anthropic/claude-opus-5",
            display_name="Claude Opus 5",
            context_window=1_000_000,
        ),
        ChatModel(
            openrouter_id="google/gemini-3.6-flash",
            display_name="Gemini 3.6 Flash",
            context_window=1_048_576,
        ),
    ]
    DEFAULT_CHAT_MODEL: str = "moonshotai/kimi-k3"

    # The tutor's only route out to the open web. Unset, web_search reports
    # itself unavailable and the agent answers from the corpus.
    PERPLEXITY_API_KEY: str | None = None
    PERPLEXITY_MODEL: str = "sonar"

    # The Telegram bot: the token BotFather issued, the @name the pairing deep
    # link is built from, and the secret Telegram echoes back on every webhook
    # call. Unset, the channel simply does not exist: the webhook refuses
    # everything and the settings page offers no pairing.
    TELEGRAM_BOT_TOKEN: str | None = None
    TELEGRAM_BOT_USERNAME: str | None = None
    TELEGRAM_WEBHOOK_SECRET: str | None = None

    DAILY_MESSAGE_CAP: int = 100
    WEB_SEARCH_DAILY_CAP: int = 20
    # The instance-wide ceiling is the software half of the budget; the other
    # half is a spend limit on the OpenRouter key itself.
    MONTHLY_COST_CEILING_USD: float = 50.0
    RUN_CLAIM_TTL_SECONDS: int = 600
    # What one run may write about the learner, and how long their profile
    # grows before the tutor is asked to consolidate it instead of extending
    # it (a soft cap: the index is instruction, not enforcement).
    MEMORY_WRITES_PER_RUN: int = 5
    MEMORY_INDEX_SOFT_CAP: int = 40
    COMPACT_AT_TOKENS: int = 200_000
    # How much conversation has to pile up after a chat was named before the
    # platform names it again. A title written from the first question stops
    # describing the chat a few exchanges later, and the rail is a list of
    # titles. How much of the conversation the naming pass then reads is
    # `harness/title.TITLE_WINDOW`, not this.
    TITLE_REFRESH_MESSAGES: int = 8
    # A naming pass runs while the learner's stream is still open, so it is
    # given a deadline rather than the HTTP client's: a provider that stalls
    # must not hold their composer disabled behind a name.
    TITLE_TIMEOUT_SECONDS: float = 10.0
    # Headroom for the next turn's system prompt, tools and reply.
    CONTEXT_RESERVE_TOKENS: int = 32_000

    @computed_field  # type: ignore[prop-decorator]
    @property
    def all_cors_origins(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def database_uri(self) -> PostgresDsn:
        return PostgresDsn.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    @computed_field  # type: ignore[prop-decorator]
    @property
    def chat_model_pool(self) -> dict[str, ChatModel]:
        return {model.openrouter_id: model for model in self.CHAT_MODELS}

    @model_validator(mode="after")
    def _guard_deployments(self) -> Self:
        if self.DEFAULT_CHAT_MODEL not in self.chat_model_pool:
            raise ValueError(
                f"DEFAULT_CHAT_MODEL={self.DEFAULT_CHAT_MODEL} is not in CHAT_MODELS"
            )
        # The defaults above exist so tests and a bare `uv run` work with no
        # environment at all; carrying them into a deployment must be loud.
        if self.ENVIRONMENT != "local":
            for name in ("POSTGRES_PASSWORD", "INVITE_CODE"):
                if getattr(self, name) == Settings.model_fields[name].default:
                    raise ValueError(
                        f"{name} is still the local default in ENVIRONMENT={self.ENVIRONMENT}"
                    )
            # Without it the service boots green and fails on the learner's
            # first message, which is the worst place to find out.
            if not self.OPENROUTER_API_KEY:
                raise ValueError(
                    f"OPENROUTER_API_KEY is unset in ENVIRONMENT={self.ENVIRONMENT}"
                )
            if not self.LOGFIRE_TOKEN:
                warnings.warn(
                    f"LOGFIRE_TOKEN unset in ENVIRONMENT={self.ENVIRONMENT}: traces stay local",
                    stacklevel=1,
                )
        return self


settings = Settings()
