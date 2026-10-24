# MediLink Backend (starter)

AWS SAM / Python 3.13 backend scaffold for a patient medication-management system.

## Included API capabilities

- Patient profile and allergy/condition fields
- Medication CRUD and active/discontinued status
- Dose event recording (`taken`, `missed`, `skipped`) and simple remaining-quantity decrement
- Patient-granted doctor access and revocation
- Private S3 document uploads using short-lived presigned URLs (PDF/JPEG/PNG)
- Audit events
- Refill-threshold status
- Interaction-check endpoint that intentionally returns `503` until a vetted drug-interaction data provider is configured

## Important limitations

This is a development starter, not a production-ready medical system. Do not upload real patient information until privacy, consent, retention, monitoring, backups, threat modelling, and applicable legal/regulatory requirements have been reviewed. The current implementation needs additional hardening and tests before deployment. It does not extract prescription text (OCR), send reminders, verify uploaded objects, or contain a drug-interaction database. It must not be used to make treatment decisions.

The doctor grant currently accepts a Cognito user `sub` supplied by the patient. A production workflow should verify the doctor's identity/role and invitation/acceptance process. Cognito claims and permissions should be reviewed before real use.

## Build

Requirements: AWS SAM CLI, Python 3.13, AWS credentials only for deployment (not for template validation/build).

```bash
sam validate --template-file template.yaml --region us-east-1
sam build --template-file template.yaml
```

The API uses Cognito JWT authorization. Before deploying, provide existing Cognito User Pool and App Client IDs:

```bash
sam deploy --guided
```

Deployment creates AWS resources that may incur charges. Do not deploy until you review the template, region, parameters, and cost implications.

## API route outline

Routes are under `/patients/{patientId}`:
- `GET|PUT /profile`
- `GET|POST /medications`
- `GET|PUT|DELETE /medications/{medicationId}`
- `GET|POST /doses`
- `GET /audit`
- `GET|POST|DELETE /doctor-access`
- `POST /documents/upload-url`
- `GET /documents`
- `GET /documents/{documentId}`
- `POST /interaction-check`
- `GET /refill-status`

Requests require a valid Cognito JWT. Send `Authorization: Bearer <access/id token>` as configured by the frontend's auth flow.
