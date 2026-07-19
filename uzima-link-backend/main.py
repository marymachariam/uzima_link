from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import patients, visits, allergies, auth, admin

from database import engine, Base
import models

from routers import patients, visits, allergies, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Uzima Link API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)
app.include_router(visits.router)
app.include_router(allergies.router)
app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/")
def root():
    return {"status": "Uzima Link API is running"}