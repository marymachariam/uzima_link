from sqlalchemy import text

from database import Base, engine
import app.models  # noqa: F401

with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.commit()

Base.metadata.create_all(bind=engine)
print("Schema dropped and tables recreated.")