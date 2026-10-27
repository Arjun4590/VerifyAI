import os
from pathlib import Path

# Paths
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

DATA_DIR = BACKEND_DIR / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
DATABASE_PATH = DATA_DIR / "verifyai.db"
DATABASE_URL = f"sqlite:///{DATABASE_PATH.as_posix()}"

WORKBOOK_PATH = PROJECT_ROOT / "handbook_extraction.xlsx"

# Fixed deterministic evaluation date as specified in APH demo scenario
DEMO_EVALUATION_DATE = "2026-04-15"

# Environment and Disclaimer Labels
ENVIRONMENT_NAME = "DEMO ENVIRONMENT"
ENVIRONMENT_BANNER = "DEMO ENVIRONMENT — NOT CONNECTED TO AICTE"
SYNTHETIC_DOC_BANNER = "SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
SIMULATED_ISSUER_BANNER = "SIMULATED — NO LIVE ISSUER API"
SIMULATED_CONNECTOR_NAME = "Demo Issuer Connector (SIMULATED)"

# Roles
ROLE_SYSTEM_ADMIN = "system_admin"
ROLE_SCRUTINY_OFFICER = "scrutiny_officer"
ROLE_SENIOR_REVIEWER = "senior_reviewer"

ALL_ROLES = [ROLE_SYSTEM_ADMIN, ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER]
