import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
import app


def make_event(path="/health", method="GET", body=None, authenticated=True):
    event = {
        "requestContext": {
            "http": {"method": method},
            "authorizer": {
                "jwt": {"claims": {"sub": "test-patient"}}
            } if authenticated else {},
        },
        "rawPath": path,
        "pathParameters": {},
    }
    if body is not None:
        event["body"] = body
    return event


def test_health_requires_authentication():
    result = app.handler(make_event(authenticated=False), None)
    assert result["statusCode"] == 401
    assert "Authentication is required" in json.loads(result["body"])["error"]


def test_unknown_route_returns_404():
    result = app.handler(
        make_event(path="/patients/test-patient/not-a-route"), None
    )
    assert result["statusCode"] == 404


def test_invalid_json_body_returns_400():
    result = app.handler(
        make_event(
            path="/patients/test-patient/medications",
            method="POST",
            body="{invalid-json",
        ),
        None,
    )
    assert result["statusCode"] == 400
    assert "valid JSON" in json.loads(result["body"])["error"]


def test_interaction_check_fails_safe(monkeypatch):
    monkeypatch.setattr(
        app, "require_patient_access", lambda *args, **kwargs: None
    )
    result = app.handler(
        make_event(
            path="/patients/test-patient/interaction-check",
            method="POST",
            body=json.dumps({"medicationNames": ["Medicine A", "Medicine B"]}),
        ),
        None,
    )
    assert result["statusCode"] == 503
    body = json.loads(result["body"])
    assert body["status"] == "unavailable"
    assert "No safety conclusion can be made" in body["message"]


def test_missed_dose_sends_alert(monkeypatch):
    saved_doses = []
    sent_alerts = []

    class FakeTable:
        def put_item(self, Item):
            saved_doses.append(Item)

    monkeypatch.setattr(
        app, "require_patient_access",
        lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        app, "get_medication",
        lambda *args, **kwargs: {
            "patientId": "test-patient",
            "medicationId": "med-1",
            "name": "Test Medicine",
            "status": "active",
        }
    )
    monkeypatch.setattr(app, "table", lambda name: FakeTable())
    monkeypatch.setattr(app, "audit", lambda *args, **kwargs: None)
    monkeypatch.setattr(app, "ALERT_TOPIC_ARN", "test-topic")
    class FakeSNS:
        def publish(self, **kwargs):
            sent_alerts.append(kwargs)

    monkeypatch.setattr(app, "sns", FakeSNS())

    result = app.handler(
        make_event(
            path="/patients/test-patient/doses",
            method="POST",
            body=json.dumps({
                "medicationId": "med-1",
                "status": "missed",
            }),
        ),
        None,
    )

    assert result["statusCode"] == 201
    assert len(saved_doses) == 1
    assert saved_doses[0]["status"] == "missed"
    assert len(sent_alerts) == 1
    assert sent_alerts[0]["TopicArn"] == "test-topic"
    assert "Test Medicine" in sent_alerts[0]["Message"]
