# Sentinel Fusion REST API Specification

## Base URL
`/api`

## Authentication
JWT Bearer token authorization header:
`Authorization: Bearer <access_token>`

---

## 1. Authentication Endpoints
- `POST /api/auth/login`
  - Request: `{"email": "lead.investigator@sentinel.local", "password": "Password123!"}`
  - Response (200): `{"access_token": "...", "token_type": "bearer", "user": {...}}`
- `POST /api/auth/logout`
  - Response (200): `{"status": "success", "message": "Successfully logged out"}`
- `GET /api/auth/me`
  - Response (200): Current `UserResponse` object.

---

## 2. Investigation Endpoints
- `GET /api/investigations?q=&status=&priority=`
  - Response (200): List of `InvestigationResponse` items with counts and risk index.
- `POST /api/investigations`
  - Request: `{"title": "Operation ...", "description": "...", "priority": "HIGH"}`
  - Response (201): Newly created `InvestigationDetailResponse`.
- `GET /api/investigations/{id}`
  - Response (200): Investigation details including members and lead investigator.
- `PATCH /api/investigations/{id}`
  - Request: `{"title": "...", "status": "REVIEW", "priority": "CRITICAL"}`
  - Response (200): Updated `InvestigationResponse`.

---

## 3. Evidence & Pipeline Endpoints
- `GET /api/investigations/{id}/evidence`
  - Response (200): List of evidence items in the case.
- `POST /api/investigations/{id}/evidence`
  - Multipart form upload with `files` list.
  - Computes SHA-256 and executes processing pipeline.
  - Response (201): List of created `EvidenceResponse` items.
- `GET /api/evidence/{id}`
  - Response (200): Full detail including `metadata_record` and `processing_jobs`.
- `GET /api/evidence/{id}/file`
  - Streams original file with proper MIME type for browser preview or download.
- `POST /api/evidence/{id}/reprocess`
  - Re-triggers the pipeline and returns the updated state.

---

## 4. Timeline & Intelligence Graph
- `GET /api/investigations/{id}/timeline?category=`
  - Response (200): Chronologically ordered `TimelineEventResponse` list.
- `POST /api/investigations/{id}/timeline`
  - Request: `{"timestamp": "...", "title": "...", "category": "TRANSACTION", ...}`
  - Response (201): Created `TimelineEventResponse`.
- `GET /api/investigations/{id}/graph`
  - Response (200): `{"nodes": [...], "edges": [...]}` formatted for React Flow.
- `POST /api/investigations/{id}/entities`
  - Request: `{"name": "...", "category": "PERSON", "risk_score": 75}`
- `POST /api/investigations/{id}/relationships`
  - Request: `{"source_entity_id": "...", "target_entity_id": "...", "relationship_type": "OWNS"}`

---

## 5. AI Findings & Risk Assessment
- `GET /api/investigations/{id}/findings?severity=&review_status=`
  - Response (200): List of AI-assisted findings.
- `PATCH /api/findings/{id}/review`
  - Request: `{"review_status": "CONFIRMED", "review_notes": "Corroborated by investigator"}`
  - Response (200): Updated `FindingResponse` with investigator confirmation timestamp.
- `GET /api/investigations/{id}/risk`
  - Response (200): Composite explainable risk assessment with factors breakdown.

---

## 6. Reports & Audit
- `GET /api/investigations/{id}/reports`
  - Response (200): List of generated dossiers.
- `POST /api/investigations/{id}/reports`
  - Request: `{"title": "Dossier ...", "format": "PDF"}`
  - Generates formal PDF or JSON file and records metadata.
- `GET /api/reports/{id}/download`
  - Streams PDF / JSON file for direct download.
- `GET /api/audit?investigation_id=&action=&limit=100`
  - Response (200): List of immutable `AuditLogResponse` records.
- `GET /api/system/status`
  - Response (200): Diagnostics on Database, Backend, Storage, OCR, and AI Provider.
- `GET /api/search?q=`
  - Response (200): Categorized results across investigations, evidence, entities, findings.
