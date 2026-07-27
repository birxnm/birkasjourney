from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from .database import create_db_and_tables, engine, get_session
from .routers import content, dashboard, habits, ielts, reminders, sleep, water
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    with Session(engine) as session:
        seed(session)
    yield


app = FastAPI(title="Productivity App API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router)
app.include_router(ielts.router)
app.include_router(habits.router)
app.include_router(water.router)
app.include_router(sleep.router)
app.include_router(content.router)
app.include_router(reminders.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/seed")
def reseed(force: bool = False, session: Session = Depends(get_session)):
    return seed(session, force=force)
