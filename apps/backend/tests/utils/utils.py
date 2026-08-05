import secrets


def random_email() -> str:
    return f"{secrets.token_hex(8)}@example.test"


def random_password() -> str:
    return secrets.token_urlsafe(16)
