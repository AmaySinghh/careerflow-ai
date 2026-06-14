def test_get_jobs_public(client):
    response = client.get("/jobs")
    assert response.status_code == 200
    data = response.json()
    assert "jobs" in data
    assert "total" in data


def test_create_job_as_recruiter(client):
    client.post("/auth/register", json={
        "email": "jobrecruiter@test.com",
        "password": "testpass123",
        "full_name": "Job Recruiter",
        "role": "recruiter"
    })
    login = client.post("/auth/login", data={
        "username": "jobrecruiter@test.com",
        "password": "testpass123"
    })
    token = login.json()["access_token"]
    response = client.post("/jobs", json={
        "title": "Python Developer",
        "company": "Test Corp",
        "location": "Bangalore, Karnataka",
        "salary_min": 600000,
        "salary_max": 1000000,
        "description": "We need a Python developer.",
        "required_skills": ["Python", "FastAPI"]
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Python Developer"
    assert data["source"] == "internal"


def test_create_job_as_candidate_forbidden(client):
    client.post("/auth/register", json={
        "email": "jobcandidate@test.com",
        "password": "testpass123",
        "full_name": "Job Candidate",
        "role": "candidate"
    })
    login = client.post("/auth/login", data={
        "username": "jobcandidate@test.com",
        "password": "testpass123"
    })
    token = login.json()["access_token"]
    response = client.post("/jobs", json={
        "title": "Unauthorized Job",
        "company": "Hacker Corp",
        "location": "Remote",
        "description": "This should fail.",
        "required_skills": []
    }, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403


def test_get_my_jobs_as_recruiter(client):
    client.post("/auth/register", json={
        "email": "myjobsrecruiter@test.com",
        "password": "testpass123",
        "full_name": "My Jobs Recruiter",
        "role": "recruiter"
    })
    login = client.post("/auth/login", data={
        "username": "myjobsrecruiter@test.com",
        "password": "testpass123"
    })
    token = login.json()["access_token"]
    response = client.get("/jobs/mine", headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    assert "jobs" in response.json()


def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "database" in data