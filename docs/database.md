# Sentinel Fusion Database Schema Specification

## 1. Relational Design Philosophy
The database is built on SQLAlchemy 2.0 with full support for SQLite (for instant local zero-setup execution) and PostgreSQL (for production deployments). Foreign key enforcement is explicitly activated on SQLite connections via SQLite PRAGMA triggers.

---

## 2. Table Specifications

### `users`
Stores authenticated forensic operators with role-based access control.
- `id` (VARCHAR(36), PK): UUID string.
- `email` (VARCHAR(255), UNIQUE, INDEX): Investigator electronic mail.
- `hashed_password` (VARCHAR(255)): Bcrypt salted password hash.
- `full_name` (VARCHAR(255)): Operator display name.
- `role` (ENUM: `ADMIN`, `INVESTIGATOR`, `ANALYST`): Authorization tier.
- `is_active` (BOOLEAN): Account enablement state.
- `created_at` (DATETIME): Timestamp.

### `investigations`
Primary case boundary representing a discrete inquiry or intelligence dossier.
- `id` (VARCHAR(36), PK): Case UUID.
- `case_number` (VARCHAR(64), UNIQUE, INDEX): Identifier (e.g., `SF-2026-001`).
- `title` (VARCHAR(255)): Name of the operation or inquiry.
- `description` (TEXT): Case mandate, targets, and scope.
- `status` (ENUM: `DRAFT`, `ACTIVE`, `REVIEW`, `CLOSED`, INDEX).
- `priority` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, INDEX).
- `lead_investigator_id` (VARCHAR(36), FK -> `users.id`).
- `created_at`, `updated_at` (DATETIME).

### `investigation_members`
Association table tracking team assignments to specific cases.
- `id` (VARCHAR(36), PK): Member record UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE).
- `user_id` (VARCHAR(36), FK -> `users.id`).
- `role_in_case` (VARCHAR(64)): Functional responsibility (e.g. Lead, Analyst).
- `assigned_at` (DATETIME).

### `evidence`
Seized digital artifacts and files.
- `id` (VARCHAR(36), PK): Evidence item UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `title` (VARCHAR(255)): Descriptive label.
- `original_filename` (VARCHAR(255)): Name on seizure.
- `stored_filename` (VARCHAR(255)): Vault filename.
- `storage_path` (VARCHAR(512)): Filesystem absolute location.
- `mime_type` (VARCHAR(128)): Media type.
- `file_size` (INTEGER): Bytes.
- `sha256_hash` (VARCHAR(64), INDEX): Cryptographic digest.
- `status` (ENUM: `UPLOADED`, `PROCESSING`, `ANALYZED`, `ERROR`, INDEX).
- `processing_stage` (ENUM: `UPLOADED`, `HASHING`, `METADATA`, `TEXT_OCR`, `ENTITY_EXTRACTION`, `AI_ANALYSIS`, `COMPLETE`, `FAILED`).
- `uploaded_by_id` (VARCHAR(36), FK -> `users.id`).
- `created_at`, `updated_at` (DATETIME).

### `evidence_metadata`
Detailed forensic characteristics extracted during pipeline execution.
- `id` (VARCHAR(36), PK): Record UUID.
- `evidence_id` (VARCHAR(36), FK -> `evidence.id` ON DELETE CASCADE, UNIQUE).
- `file_format` (VARCHAR(64)): Specific format.
- `width`, `height` (INTEGER): Image raster dimensions.
- `created_date` (VARCHAR(64)): Embedded capture timestamp.
- `device_make`, `device_model` (VARCHAR(128)): Sensor hardware make/model.
- `gps_latitude`, `gps_longitude` (FLOAT): Geographic coordinates.
- `author` (VARCHAR(255)): Document author.
- `page_count` (INTEGER): Document pages.
- `extracted_text` (TEXT): Plaintext stream or OCR text.
- `authenticity_score` (FLOAT): Heuristic score (0.0 to 1.0).
- `authenticity_notes` (TEXT): Explanatory analysis notes.
- `raw_metadata_json` (TEXT): Full raw tag dump.

### `processing_jobs`
Lifecycle transitions for asynchronous evidence pipeline inspection.
- `id` (VARCHAR(36), PK): Job UUID.
- `evidence_id` (VARCHAR(36), FK -> `evidence.id` ON DELETE CASCADE, INDEX).
- `stage` (ENUM: ProcessingStage).
- `status` (ENUM: `PENDING`, `RUNNING`, `COMPLETED`, `FAILED`).
- `error_message` (TEXT).
- `started_at`, `completed_at` (DATETIME).

### `entities`
Nodes in the intelligence graph.
- `id` (VARCHAR(36), PK): Entity UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `name` (VARCHAR(255), INDEX): Target identifier or name.
- `category` (ENUM: `PERSON`, `DEVICE`, `ACCOUNT`, `LOCATION`, `EVIDENCE`, `ORGANIZATION`, INDEX).
- `risk_score` (INTEGER): 0-100.
- `attributes_json` (TEXT): Key-value properties.
- `created_at` (DATETIME).

### `relationships`
Edges in the intelligence graph.
- `id` (VARCHAR(36), PK): Relationship UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `source_entity_id` (VARCHAR(36), FK -> `entities.id` ON DELETE CASCADE, INDEX).
- `target_entity_id` (VARCHAR(36), FK -> `entities.id` ON DELETE CASCADE, INDEX).
- `relationship_type` (ENUM: `OWNS`, `USES`, `COMMUNICATED_WITH`, `LOCATED_AT`, `ASSOCIATED_WITH`, `APPEARS_IN`).
- `confidence` (FLOAT): 0.0 - 1.0.
- `evidence_id` (VARCHAR(36), FK -> `evidence.id` ON DELETE SET NULL).
- `description` (TEXT).
- `created_at` (DATETIME).

### `timeline_events`
Chronological occurrences anchored in case evidence.
- `id` (VARCHAR(36), PK): Event UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `evidence_id` (VARCHAR(36), FK -> `evidence.id` ON DELETE SET NULL).
- `timestamp` (DATETIME, INDEX): Date and time of occurrence.
- `title` (VARCHAR(255)): Event headline.
- `description` (TEXT): Context and details.
- `category` (ENUM: `COMMUNICATION`, `TRANSACTION`, `LOCATION`, `ACCESS`, `MEDIA`, `GENERAL`, INDEX).
- `confidence` (FLOAT): 0.0 - 1.0.
- `is_demo` (BOOLEAN): Synthetic marker.
- `created_at` (DATETIME).

### `findings`
AI-assisted hypotheses requiring human confirmation.
- `id` (VARCHAR(36), PK): Finding UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `evidence_id` (VARCHAR(36), FK -> `evidence.id` ON DELETE SET NULL).
- `title` (VARCHAR(255)): Finding summary.
- `summary` (TEXT): Narrative briefing.
- `severity` (ENUM: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`, INDEX).
- `confidence` (FLOAT): Model score (0.0 - 1.0).
- `review_status` (ENUM: `NEW`, `REVIEWED`, `CONFIRMED`, `DISMISSED`, INDEX).
- `reviewed_by_id` (VARCHAR(36), FK -> `users.id`).
- `reviewed_at` (DATETIME).
- `review_notes` (TEXT): Investigator verification notes.
- `explanation` (TEXT): Analytical reasoning.
- `analysis_mode` (VARCHAR(64)): Provider tag (`DEMO_ANALYSIS`, `OLLAMA_LOCAL`).
- `created_at` (DATETIME).

### `risk_assessments`
Composite, explainable risk calculations per investigation.
- `id` (VARCHAR(36), PK): UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `overall_score` (INTEGER): 0 - 100.
- `risk_tier` (ENUM: `LOW`, `MODERATE`, `HIGH`, `CRITICAL`).
- `factors_json` (TEXT): Factor weights, scores, and explanations.
- `assessment_mode` (VARCHAR(64)): Heuristic model tag.
- `calculated_at` (DATETIME).

### `reports`
Generated formal investigative dossiers.
- `id` (VARCHAR(36), PK): Dossier UUID.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `title` (VARCHAR(255)): Report headline.
- `format` (ENUM: `PDF`, `JSON`).
- `file_path` (VARCHAR(512)): Disk location.
- `file_size` (INTEGER): Bytes.
- `generated_by_id` (VARCHAR(36), FK -> `users.id`).
- `created_at` (DATETIME).

### `audit_logs`
Immutable chain of custody and operator audit entries.
- `id` (VARCHAR(36), PK): Audit record UUID.
- `user_id` (VARCHAR(36), FK -> `users.id` ON DELETE SET NULL).
- `user_email` (VARCHAR(255)): Operator email snapshot.
- `investigation_id` (VARCHAR(36), FK -> `investigations.id` ON DELETE CASCADE, INDEX).
- `action` (ENUM: `LOGIN`, `LOGOUT`, `CASE_CREATE`, `CASE_UPDATE`, `EVIDENCE_UPLOAD`, `EVIDENCE_PROCESS`, `EVIDENCE_VIEW`, `FINDING_REVIEW`, `REPORT_GENERATE`, `ENTITY_CREATE`, `RELATIONSHIP_CREATE`, `TIMELINE_CREATE`, INDEX).
- `resource_type` (VARCHAR(64)): Target entity type.
- `resource_id` (VARCHAR(64)): Target record ID.
- `details_json` (TEXT): Event payload and metadata changes.
- `ip_address` (VARCHAR(64)): Operator network address.
- `timestamp` (DATETIME, INDEX).
