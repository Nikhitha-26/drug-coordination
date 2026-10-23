
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import app


def test_health_requires_authentication():
    event = {
        "requestContext": {"http": {"method": "GET"}},
        "rawPath": "/health",
        "pathParameters": {},
    }

    result = app.handler(event, None)

    assert result["statusCode"] == 401
    body = json.loads(result["body"])
    assert "Authentication is required" in body["error"]
