"""The HTTP API front-ends rely on: state, images, episodes and commands."""

import numpy as np
from fastapi.testclient import TestClient

from kofee.standalone.api import Hub, create_api


def test_api_serves_state_images_and_queues_commands(tmp_path):
    hub = Hub()
    hub.publish({"state": "ready"}, {"board": np.zeros((10, 20, 3), np.uint8)}, [{"episode": 1}])
    client = TestClient(create_api(hub, tmp_path))

    assert client.get("/api/state").json() == {"state": "ready"}
    assert client.get("/api/episodes").json() == [{"episode": 1}]
    image = client.get("/frame/board.jpg")
    assert image.status_code == 200 and image.headers["content-type"] == "image/jpeg"
    assert client.get("/frame/nope.jpg").status_code == 404

    assert client.post("/api/command", json={"action": "done"}).json() == {"ok": True}
    assert hub.commands.get_nowait()["action"] == "done"
    assert client.post("/api/command", json={"action": "fly"}).status_code == 400
    assert client.post("/api/command", json={"action": "calibrate", "corners": [[0, 0]]}).status_code == 400
