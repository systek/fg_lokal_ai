from fastapi.testclient import TestClient

from romby.main import app


# The one sample test. Use it as a pattern and let your local model generate the rest.
def test_lists_the_seeded_rooms():
    # "with" runs the app's lifespan, which seeds the database.
    with TestClient(app) as client:
        response = client.get("/api/rooms")

    assert response.status_code == 200
    rooms = response.json()
    assert len(rooms) == 4
    assert rooms[0]["name"] == "Fjorden"
