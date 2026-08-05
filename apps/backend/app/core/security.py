from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher

# The policy lives here so every entry point that sets a password — the API
# schema and the CLI prompt — enforces the same bounds.
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# Argon2 first, bcrypt kept only so hashes written by older tooling still
# verify — verify_and_update rewrites them on the next successful login.
password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)
