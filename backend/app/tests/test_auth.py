def test_register_candidate(client):
    response = client.post("/auth/register", json={
        "email": "newcandidate@test.com",
        "password": "securepass123",
        "full_name": "New Candidate",
        "role": "candidate"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newcandidate@test.com"
    assert data["role"] == "candidate"
    assert "hashed_password" not in data


def test_register_recruiter(client):
    response = client.post("/auth/register", json={
        "email": "newrecruiter@test.com",
        "password": "securepass123",
        "full_name": "New Recruiter",
        "role": "recruiter"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["role"] == "recruiter"


def test_register_duplicate_email(client):
    client.post("/auth/register", json={
        "email": "duplicate@test.com",
        "password": "pass123",
        "full_name": "First User",
        "role": "candidate"
    })
    response = client.post("/auth/register", json={
        "email": "duplicate@test.com",
        "password": "pass123",
        "full_name": "Second User",
        "role": "candidate"
    })
    assert response.status_code == 400


def test_login_success(client):
    client.post("/auth/register", json={
        "email": "logintest@test.com",
        "password": "testpass123",
        "full_name": "Login Test",
        "role": "candidate"
    })
    response = client.post("/auth/login", data={
        "username": "logintest@test.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_wrong_password(client):
    client.post("/auth/register", json={
        "email": "wrongpass@test.com",
        "password": "correctpass",
        "full_name": "Wrong Pass",
        "role": "candidate"
    })
    response = client.post("/auth/login", data={
        "username": "wrongpass@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401


def test_login_nonexistent_user(client):
    response = client.post("/auth/login", data={
        "username": "nobody@test.com",
        "password": "anypassword"
    })
    assert response.status_code == 401


def test_get_current_user(client):
    client.post("/auth/register", json={
        "email": "metest@test.com",
        "password": "testpass123",
        "full_name": "Me Test",
        "role": "candidate"
    })
    login = client.post("/auth/login", data={
        "username": "metest@test.com",
        "password": "testpass123"
    })
    token = login.json()["access_token"]
    response = client.get("/auth/me", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert response.json()["email"] == "metest@test.com"


def test_get_current_user_no_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401