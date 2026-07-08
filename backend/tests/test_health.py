def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}

def test_docs(client):
    assert client.get("/openapi.json").status_code == 200
