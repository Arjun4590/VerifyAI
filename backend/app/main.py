import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .database import engine, Base, SessionLocal
from .config import ENVIRONMENT_NAME, ENVIRONMENT_BANNER, DEMO_EVALUATION_DATE
from .models import Application, CatalogueCategory
from .importer import import_handbook_catalogue
from .seed import seed_demo_data

from .routers import (
    system,
    applications,
    findings,
    alerts,
    catalogue,
    rules
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verifyai")

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="VerifyAI Regulatory Scrutiny Platform API",
    description="Internal Decision-Support Platform for Application Validation and Regulatory Compliance Verification",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred in the VerifyAI backend engine.", "error": str(exc)}
    )

# Include Routers
app.include_router(system.router)
app.include_router(applications.router)
app.include_router(findings.router)
app.include_router(alerts.router)
app.include_router(catalogue.router)
app.include_router(rules.router)

@app.on_event("startup")
def startup_event():
    """
    On startup, verify database population.
    If catalogue or applications are empty, automatically import and seed.
    """
    db = SessionLocal()
    try:
        cat_count = db.query(CatalogueCategory).count()
        if cat_count == 0:
            logger.info("Catalogue empty. Initializing workbook import from handbook_extraction.xlsx...")
            import_handbook_catalogue(db)

        app_count = db.query(Application).count()
        if app_count == 0:
            logger.info("Applications empty. Initializing deterministic synthetic demo seed...")
            seed_demo_data(db)
        logger.info("VerifyAI backend startup initialization complete.")
    except Exception as e:
        logger.error(f"Startup initialization error: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "service": "VerifyAI Decision-Support Regulatory Engine",
        "version": "2.0.0",
        "environment": ENVIRONMENT_NAME,
        "disclaimer": ENVIRONMENT_BANNER,
        "evaluation_date": DEMO_EVALUATION_DATE,
        "docs_url": "/docs"
    }
