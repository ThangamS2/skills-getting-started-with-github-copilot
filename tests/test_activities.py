from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # basic sanity: known sample activity exists
    assert "Chess Club" in data


def test_get_participants():
    res = client.get("/activities/Chess Club/participants")
    assert res.status_code == 200
    body = res.json()
    assert "participants" in body
    assert isinstance(body["participants"], list)


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "tester@example.com"

    # Ensure email is not present before starting (clean up if needed)
    res = client.get(f"/activities/{activity}/participants")
    assert res.status_code == 200
    participants = res.json().get("participants", [])
    if email in participants:
        r = client.post(f"/activities/{activity}/unregister?email={email}")
        # allow either success or not found depending on prior state
        assert r.status_code in (200, 400)

    # Signup should succeed
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert email in client.get(f"/activities/{activity}/participants").json()["participants"]

    # Signing up again returns 400 (already registered)
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 400

    # Unregister should succeed
    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == 200

    # Unregister again should return 400 (not registered)
    res = client.post(f"/activities/{activity}/unregister?email={email}")
    assert res.status_code == 400
