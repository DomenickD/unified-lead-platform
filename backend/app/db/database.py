# # Database connection placeholder — swap in your engine once a DB is chosen.
# # Example engines:
# #   PostgreSQL:  from sqlalchemy import create_engine; engine = create_engine(DATABASE_URL)
# #   SQLite:      from sqlalchemy import create_engine; engine = create_engine("sqlite:///./dev.db")
# #   MongoDB:     from motor.motor_asyncio import AsyncIOMotorClient; client = AsyncIOMotorClient(MONGO_URI)

# DATABASE_URL = None  # set via environment variable

# def get_db():
#     raise NotImplementedError("Database not configured yet")


"""
Generate a bcrypt password hash for manual SQL inserts.

Usage:
  python backend/scripts/hash_password.py "your-password"
"""

import getpass
import sys

import bcrypt


def main() -> None:
    password = sys.argv[1] if len(sys.argv) > 1 else getpass.getpass("Password: ")
    if not password:
        raise SystemExit("Password cannot be empty.")

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
    print(password_hash)


if __name__ == "__main__":
    main()