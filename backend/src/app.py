import json
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError
from boto3.dynamodb.conditions import Key

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

TABLES = {
    "patients": os.getenv("PATIENTS_TABLE", "Patients"),
    "medications": os.getenv("MEDICATIONS_TABLE", "Medications"),
    "doses": os.getenv("DOSE_EVENTS_TABLE", "DoseEvents"),
    "audit": os.getenv("AUDIT_EVENTS_TABLE", "AuditEvents"),
    "documents": os.getenv("DOCUMENTS_TABLE", "Documents"),
    "doctor_access": os.getenv("DOCTOR_ACCESS_TABLE", "DoctorAccess"),
}
UPLOAD_BUCKET = os.getenv("DOCUMENTS_BUCKET", "")
ALERT_TOPIC_ARN = os.getenv("ALERT_TOPIC_ARN", "")

def _json_default(value):
    if isinstance(value, Decimal):
        return int(value) if value % 1 == 0 else float(value)
    raise TypeError(f"Cannot serialize {type(value).__name__}")

def response(status, body):
    return {
        "statusCode": status,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": os.getenv("CORS_ORIGIN", "http://localhost:5173"),
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Vary": "Origin",
        },
        "body": json.dumps(body, default=_json_default),
    }

def now():
    return datetime.now(timezone.utc).isoformat()

def body_json(event):
    raw = event.get("body")
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except (TypeError, json.JSONDecodeError) as exc:
        raise ValueError("Request body must be valid JSON") from exc
    if not isinstance(parsed, dict):
        raise ValueError("Request body must be a JSON object")
    return parsed

def path_params(event):
    return event.get("pathParameters") or {}

def required_text(data, field, max_length=200):
    value = data.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    value = value.strip()
    if len(value) > max_length:
        raise ValueError(f"{field} must be {max_length} characters or fewer")
    return value


def optional_nonnegative_number(value, field):
    if value is None or value == "":
        return None
    if isinstance(value, bool) or not isinstance(value, (int, float, Decimal)):
        raise ValueError(f"{field} must be a non-negative number")
    if value < 0:
        raise ValueError(f"{field} must be a non-negative number")
    return value


def caller(event):
    # API Gateway HTTP API JWT authorizer places verified Cognito claims here.
    claims = (((event.get("requestContext") or {}).get("authorizer") or {}).get("jwt") or {}).get("claims") or {}
    sub = claims.get("sub")
    if not sub:
        raise PermissionError("Authentication is required. Call this endpoint through the configured Cognito-authorized API.")
    return {"id": sub, "email": claims.get("email", ""), "role": claims.get("custom:role", "patient")}

def table(name):
    return dynamodb.Table(TABLES[name])

def audit(patient_id, actor, action, entity_type, entity_id, details=None):
    item = {
        "patientId": patient_id,
        "eventId": str(uuid.uuid4()),
        "timestamp": now(),
        "actorId": actor["id"],
        "actorRole": actor.get("role", "patient"),
        "action": action,
        "entityType": entity_type,
        "entityId": entity_id,
        "details": details or {},
    }
    table("audit").put_item(Item=item)

def require_patient_access(patient_id, actor, write=False):
    if actor["id"] == patient_id and actor.get("role") != "doctor":
        return
    # Doctors must have an explicit, active grant for this patient.
    key = {"doctorId": actor["id"], "patientId": patient_id}
    grant = table("doctor_access").get_item(Key=key).get("Item")
    if not grant or grant.get("status") != "active":
        raise PermissionError("You do not have access to this patient's records.")
    if write and not grant.get("canWrite", False):
        raise PermissionError("This doctor has read-only access.")

def get_medication(patient_id, medication_id):
    result = table("medications").get_item(Key={"patientId": patient_id, "medicationId": medication_id})
    return result.get("Item")

def handler(event, context):
    try:
        method = event.get("requestContext", {}).get("http", {}).get("method", "GET")
        path = event.get("rawPath", "/")
        if method == "OPTIONS":
            return response(204, {})
        actor = caller(event)
        params = path_params(event)
        patient_id = params.get("patientId") or actor["id"]
        require_patient_access(patient_id, actor, write=method in ("POST", "PUT", "DELETE"))

        # Health check: authenticated so it doesn't leak deployment details.
        if path.endswith("/health") and method == "GET":
            return response(200, {"status": "ok", "service": "medilink-api", "time": now()})

        if path.endswith("/profile") and method in ("GET", "PUT"):
            if method == "GET":
                result = table("patients").get_item(Key={"patientId": patient_id}).get("Item")
                return response(200, {"profile": result or {"patientId": patient_id}})
            data = body_json(event)
            allowed = ("displayName", "dateOfBirth", "phone", "emergencyContact", "allergies", "conditions")
            item = {"patientId": patient_id, "updatedAt": now()}
            for key in allowed:
                if key in data:
                    item[key] = data[key]
            table("patients").update_item(
                Key={"patientId": patient_id},
                UpdateExpression="SET " + ", ".join(f"#{k}=:{k}" for k in item if k != "patientId"),
                ExpressionAttributeNames={f"#{k}": k for k in item if k != "patientId"},
                ExpressionAttributeValues={f":{k}": v for k, v in item.items() if k != "patientId"},
            )
            audit(patient_id, actor, "profile.updated", "patient", patient_id)
            return response(200, {"message": "Profile saved", "patientId": patient_id})

        if path.endswith("/medications") and method == "GET":
            items = table("medications").query(KeyConditionExpression=Key("patientId").eq(patient_id)).get("Items", [])
            return response(200, {"items": items})
        if path.endswith("/medications") and method == "POST":
            data = body_json(event)
            required = ("name", "dose", "unit", "frequency")
            missing = [k for k in required if not data.get(k)]
            if missing:
                return response(400, {"error": "Missing required fields", "fields": missing})
            schedule = data.get("schedule", [])
            if not isinstance(schedule, list):
                raise ValueError("schedule must be a list")
            quantity = optional_nonnegative_number(data.get("quantityRemaining"), "quantityRemaining")
            threshold = optional_nonnegative_number(data.get("refillThreshold", 5), "refillThreshold")
            item = {
                "patientId": patient_id,
                "medicationId": str(uuid.uuid4()),
                "name": required_text(data, "name", 120),
                "dose": required_text(data, "dose", 80),
                "unit": required_text(data, "unit", 40),
                "frequency": required_text(data, "frequency", 120),
                "schedule": schedule,
                "startDate": required_text(data, "startDate", 10) if data.get("startDate") else now()[:10],
                "endDate": data.get("endDate"),
                "quantityRemaining": quantity,
                "refillThreshold": threshold if threshold is not None else 5,
                "prescriber": str(data.get("prescriber", ""))[:160],
                "status": "active",
                "createdAt": now(),
                "updatedAt": now(),
            }
            table("medications").put_item(Item=item)
            audit(patient_id, actor, "medication.created", "medication", item["medicationId"])
            return response(201, {"medication": item})

        if params.get("medicationId") and path.endswith("/medications/" + params["medicationId"]) and method in ("GET", "PUT", "DELETE"):
            med_id = params["medicationId"]
            existing = get_medication(patient_id, med_id)
            if not existing:
                return response(404, {"error": "Medication not found"})
            if method == "GET":
                return response(200, {"medication": existing})
            if method == "DELETE":
                table("medications").update_item(
                    Key={"patientId": patient_id, "medicationId": med_id},
                    UpdateExpression="SET #s=:s, updatedAt=:u",
                    ExpressionAttributeNames={"#s": "status"},
                    ExpressionAttributeValues={":s": "discontinued", ":u": now()},
                )
                audit(patient_id, actor, "medication.discontinued", "medication", med_id)
                return response(200, {"message": "Medication marked discontinued"})
            data = body_json(event)
            allowed = ("name", "dose", "unit", "frequency", "schedule", "startDate", "endDate", "quantityRemaining", "refillThreshold", "prescriber", "status")
            updates = {k: data[k] for k in allowed if k in data}
            if not updates:
                return response(400, {"error": "No supported fields provided"})
            for field in ("name", "dose", "unit", "frequency"):
                if field in updates:
                    updates[field] = required_text(data, field, 120 if field == "name" else 120)
            if "schedule" in updates and not isinstance(updates["schedule"], list):
                raise ValueError("schedule must be a list")
            for field in ("quantityRemaining", "refillThreshold"):
                if field in updates:
                    updates[field] = optional_nonnegative_number(updates[field], field)
            if "status" in updates and updates["status"] not in ("active", "discontinued"):
                raise ValueError("status must be active or discontinued")
            updates["updatedAt"] = now()
            names = {f"#{k}": k for k in updates}
            values = {f":{k}": v for k, v in updates.items()}
            table("medications").update_item(
                Key={"patientId": patient_id, "medicationId": med_id},
                UpdateExpression="SET " + ", ".join(f"#{k}=:{k}" for k in updates),
                ExpressionAttributeNames=names,
                ExpressionAttributeValues=values,
            )
            audit(patient_id, actor, "medication.updated", "medication", med_id)
            return response(200, {"message": "Medication updated", "medicationId": med_id})

        if path.endswith("/doses") and method == "GET":
            items = table("doses").query(KeyConditionExpression=Key("patientId").eq(patient_id), ScanIndexForward=False, Limit=100).get("Items", [])
            return response(200, {"items": items})
        if path.endswith("/doses") and method == "POST":
            data = body_json(event)
            med_id = data.get("medicationId")
            status = data.get("status")
            if not med_id or status not in ("taken", "missed", "skipped"):
                return response(400, {"error": "medicationId and status (taken, missed, skipped) are required"})
            med = get_medication(patient_id, med_id)
            if not med or med.get("status") != "active":
                return response(404, {"error": "Active medication not found"})
            event_id = str(uuid.uuid4())
            notes = data.get("notes", "")
            if not isinstance(notes, str):
                raise ValueError("notes must be a string")
            item = {
                "patientId": patient_id,
                "doseEventId": event_id,
                "medicationId": med_id,
                "status": status,
                "recordedAt": now(),
                "notes": notes[:1000],
            }
            if data.get("scheduledAt") is not None:
                item["scheduledAt"] = required_text(data, "scheduledAt", 64)
            table("doses").put_item(Item=item)
            if status == "taken" and isinstance(med.get("quantityRemaining"), (int, Decimal)):
                remaining = max(0, int(med["quantityRemaining"]) - 1)
                table("medications").update_item(
                    Key={"patientId": patient_id, "medicationId": med_id},
                    UpdateExpression="SET quantityRemaining=:q, updatedAt=:u",
                    ExpressionAttributeValues={":q": remaining, ":u": now()},
                )
            audit(patient_id, actor, "dose." + status, "dose", event_id, {"medicationId": med_id})
            return response(201, {"doseEvent": item})

        if path.endswith("/audit") and method == "GET":
            items = table("audit").query(KeyConditionExpression=Key("patientId").eq(patient_id), ScanIndexForward=False, Limit=100).get("Items", [])
            return response(200, {"items": items})

        if path.endswith("/doctor-access") and method == "POST":
            # A patient grants a known Cognito user ID. The backend does not create doctor accounts.
            if actor["id"] != patient_id:
                return response(403, {"error": "Only the patient can grant doctor access"})
            data = body_json(event)
            doctor_id = data.get("doctorId")
            if not doctor_id:
                return response(400, {"error": "doctorId is required"})
            can_write = data.get("canWrite", False)
            if not isinstance(can_write, bool):
                raise ValueError("canWrite must be true or false")
            item = {
                "doctorId": required_text({"doctorId": doctor_id}, "doctorId", 128),
                "patientId": patient_id,
                "status": "active",
                "canWrite": can_write,
                "createdAt": now(),
                "grantedBy": actor["id"],
            }
            table("doctor_access").put_item(Item=item)
            audit(patient_id, actor, "doctor.access_granted", "doctor", str(doctor_id))
            return response(201, {"access": item})
        if path.endswith("/doctor-access") and method == "GET":
            if actor["id"] != patient_id:
                return response(403, {"error": "Only the patient can list doctor grants"})
            items = table("doctor_access").query(
                IndexName="PatientAccessIndex",
                KeyConditionExpression=Key("patientId").eq(patient_id),
            ).get("Items", [])
            return response(200, {"items": items})
        if path.endswith("/doctor-access") and method == "DELETE":
            data = body_json(event)
            doctor_id = data.get("doctorId")
            if actor["id"] != patient_id or not doctor_id:
                return response(403, {"error": "Patient identity and doctorId are required"})
            table("doctor_access").update_item(
                Key={"doctorId": doctor_id, "patientId": patient_id},
                UpdateExpression="SET #s=:s, revokedAt=:t",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":s": "revoked", ":t": now()},
            )
            audit(patient_id, actor, "doctor.access_revoked", "doctor", doctor_id)
            return response(200, {"message": "Doctor access revoked"})

        if path.endswith("/documents/upload-url") and method == "POST":
            data = body_json(event)
            filename = os.path.basename(str(data.get("filename", "")))[:120]
            content_type = data.get("contentType", "application/octet-stream")
            allowed = {"application/pdf", "image/jpeg", "image/png"}
            if not filename or content_type not in allowed:
                return response(400, {"error": "filename and contentType (PDF, JPEG, PNG) are required"})
            if not UPLOAD_BUCKET:
                return response(503, {"error": "Document storage is not configured"})
            document_id = str(uuid.uuid4())
            key = f"patients/{patient_id}/{document_id}/{filename}"
            url = s3.generate_presigned_url(
                "put_object",
                Params={"Bucket": UPLOAD_BUCKET, "Key": key, "ContentType": content_type, "ServerSideEncryption": "AES256"},
                ExpiresIn=300,
            )
            item = {
                "patientId": patient_id,
                "documentId": document_id,
                "s3Key": key,
                "filename": filename,
                "contentType": content_type,
                "status": "upload_pending",
                "createdAt": now(),
                "uploadedBy": actor["id"],
            }
            table("documents").put_item(Item=item)
            audit(patient_id, actor, "document.upload_url_created", "document", document_id)
            return response(201, {"documentId": document_id, "uploadUrl": url, "expiresInSeconds": 300, "requiredHeaders": {"Content-Type": content_type, "x-amz-server-side-encryption": "AES256"}})
        if params.get("documentId") and path.endswith("/documents/" + params["documentId"] + "/complete") and method == "POST":
            document_id = params["documentId"]
            item = table("documents").get_item(Key={"patientId": patient_id, "documentId": document_id}).get("Item")
            if not item:
                return response(404, {"error": "Document not found"})
            if item.get("status") == "uploaded":
                return response(200, {"message": "Document already verified", "documentId": document_id})
            try:
                head = s3.head_object(Bucket=UPLOAD_BUCKET, Key=item["s3Key"])
            except ClientError as exc:
                code = exc.response.get("Error", {}).get("Code", "")
                if code in ("404", "NoSuchKey", "NotFound"):
                    return response(409, {"error": "Upload not found. Upload the file before completing."})
                raise
            if head.get("ContentType") != item.get("contentType"):
                return response(400, {"error": "Uploaded content type does not match the declared type"})
            if head.get("ContentLength", 0) > 10 * 1024 * 1024:
                s3.delete_object(Bucket=UPLOAD_BUCKET, Key=item["s3Key"])
                return response(413, {"error": "Documents must be 10 MB or smaller"})
            table("documents").update_item(
                Key={"patientId": patient_id, "documentId": document_id},
                UpdateExpression="SET #s=:s, verifiedAt=:t, sizeBytes=:b",
                ExpressionAttributeNames={"#s": "status"},
                ExpressionAttributeValues={":s": "uploaded", ":t": now(), ":b": head.get("ContentLength", 0)},
            )
            audit(patient_id, actor, "document.upload_verified", "document", document_id)
            return response(200, {"message": "Document uploaded and verified", "documentId": document_id})

        if path.endswith("/documents") and method == "GET":
            items = table("documents").query(KeyConditionExpression=Key("patientId").eq(patient_id)).get("Items", [])
            return response(200, {"items": items})
        if params.get("documentId") and path.endswith("/documents/" + params["documentId"]) and method == "GET":
            item = table("documents").get_item(Key={"patientId": patient_id, "documentId": params["documentId"]}).get("Item")
            if not item:
                return response(404, {"error": "Document not found"})
            if item.get("status") != "uploaded":
                return response(409, {"error": "Document upload has not been verified yet"})
            if not UPLOAD_BUCKET:
                return response(503, {"error": "Document storage is not configured"})
            url = s3.generate_presigned_url("get_object", Params={"Bucket": UPLOAD_BUCKET, "Key": item["s3Key"]}, ExpiresIn=300)
            return response(200, {"document": item, "downloadUrl": url, "expiresInSeconds": 300})

        if path.endswith("/interaction-check") and method == "POST":
            data = body_json(event)
            names = data.get("medicationNames")
            if not isinstance(names, list) or not names:
                return response(400, {"error": "medicationNames must be a non-empty list"})
            # Never claim a combination is safe without a validated drug knowledge source.
            return response(503, {
                "status": "unavailable",
                "message": "A verified drug-interaction knowledge source has not been configured. No safety conclusion can be made.",
                "medicationCount": len(names),
            })

        if path.endswith("/refill-status") and method == "GET":
            items = table("medications").query(KeyConditionExpression=Key("patientId").eq(patient_id)).get("Items", [])
            refill = []
            for med in items:
                if med.get("status") == "active" and isinstance(med.get("quantityRemaining"), (int, Decimal)):
                    threshold = int(med.get("refillThreshold", 5))
                    if int(med["quantityRemaining"]) <= threshold:
                        refill.append({"medicationId": med["medicationId"], "name": med["name"], "quantityRemaining": int(med["quantityRemaining"]), "threshold": threshold, "status": "refill_due"})
            return response(200, {"items": refill})

        return response(404, {"error": "Route not found", "path": path, "method": method})
    except PermissionError as exc:
        return response(401 if "Authentication" in str(exc) else 403, {"error": str(exc)})
    except ValueError as exc:
        return response(400, {"error": str(exc)})
    except Exception:
        # Log stack trace for operators, but never return internal details to clients.
        logger.exception("Unhandled backend error")
        return response(500, {"error": "Internal server error"})
