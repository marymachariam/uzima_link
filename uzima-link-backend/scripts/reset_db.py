from sqlalchemy import text

import app.models  # noqa: F401
from database import Base, engine

with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.commit()

Base.metadata.create_all(bind=engine)
print("Schema dropped and tables recreated.")
