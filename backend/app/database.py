import sqlite3
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from .config import DATABASE_URL, DATA_DIR, DATABASE_PATH

DATA_DIR.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    if DATABASE_PATH.exists():
        try:
            conn = sqlite3.connect(str(DATABASE_PATH))
            cur = conn.cursor()
            cur.execute("PRAGMA table_info(applications)")
            existing_cols = {row[1] for row in cur.fetchall()}
            if existing_cols:
                cols_to_add = {
                    "institution_code": "TEXT DEFAULT 'AICTE-1-10928374'",
                    "intake_capacity": "INTEGER DEFAULT 420",
                    "total_faculty": "INTEGER DEFAULT 28",
                    "land_area_acres": "REAL DEFAULT 5.25",
                    "built_up_area_sqm": "REAL DEFAULT 12450.0",
                    "trust_name": "TEXT DEFAULT 'Demo Educational Trust'"
                }
                for col_name, col_def in cols_to_add.items():
                    if col_name not in existing_cols:
                        cur.execute(f"ALTER TABLE applications ADD COLUMN {col_name} {col_def}")
                conn.commit()
            conn.close()
        except Exception as e:
            print(f"Migration notice: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
