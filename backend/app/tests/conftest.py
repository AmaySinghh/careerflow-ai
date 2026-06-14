import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
import os

os.environ["HTTPX_DISABLE"] = "1"

TEST_DATABASE_URL = "postgresql://postgres:postgres@db:5432/jobhunter_test"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    app.dependency_overrides[get_db] = override_get_db
    client = TestClient(app, raise_server_exceptions=True)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_candidate(client):
    response = client.post("/auth/register", json={
        "email": "testcandidate@test.com",
        "password": "testpass123",
        "full_name": "Test Candidate",
        "role": "candidate"
    })
    return response.json()


@pytest.fixture()
def candidate_token(client, registered_candidate):
    response = client.post("/auth/login", data={
        "username": "testcandidate@test.com",
        "password": "testpass123"
    })
    return response.json()["access_token"]


@pytest.fixture()
def registered_recruiter(client):
    response = client.post("/auth/register", json={
        "email": "testrecruiter@test.com",
        "password": "testpass123",
        "full_name": "Test Recruiter",
        "role": "recruiter"
    })
    return response.json()


@pytest.fixture()
def recruiter_token(client, registered_recruiter):
    response = client.post("/auth/login", data={
        "username": "testrecruiter@test.com",
        "password": "testpass123"
    })
    return response.json()["access_token"]