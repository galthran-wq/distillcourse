from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

# The policy lives here so every entry point that sets a password — the API
# schema and the CLI prompt — enforces the same bounds.
MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_LENGTH = 128

# Argon2 and nothing else: every hash in this database was written by migration
# 0001 onwards, by this function. A second hasher, and the rehash-on-login it
# implies, would be scaffolding for a migration that has never happened.
password_hash = PasswordHash((Argon2Hasher(),))


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)
