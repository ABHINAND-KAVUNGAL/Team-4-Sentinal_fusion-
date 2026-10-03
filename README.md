# SENTINEL FUSION

### AI-Assisted Digital Intelligence Fusion Platform for Digital Forensics & Investigations

[![Status](https://img.shields.io/badge/status-production--ready-emerald.svg)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%7C%20Python%203.9+-blue.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2014%20%7C%20React%20%7C%20TypeScript-000000.svg)]()
[![Zero Paid APIs](https://img.shields.io/badge/AI%20Cost-%240.00%20(No%20Paid%20APIs)-brightgreen.svg)]()
[![Integrity](https://img.shields.io/badge/Integrity-SHA--256%20Cryptographic%20Verification-blue.svg)]()

---

## 1. Problem Statement
Digital forensic investigations routinely face a critical bottleneck: evidence is heavily fragmented across disparate images, transaction ledgers, intercepted messages, registry records, and geographic coordinates.

Investigators must manually cross-reference files, verify data integrity, reconstruct chronological timelines, and map suspect networks. Commercial enterprise intelligence platforms often introduce steep licensing costs, black-box AI conclusions, and mandatory cloud dependencies that violate evidentiary custody requirements.

---

## 2. The Solution: Sentinel Fusion
Sentinel Fusion unifies fragmented digital evidence into a connected, explainable, and auditable intelligence graph.

Key architectural tenets:
1. **AI is an Assistant, Not the Investigator:** AI never makes autonomous legal conclusions, arrests, or guilt determinations. Hypotheses are surfaced as *AI-assisted findings* requiring explicit human confirmation.
2. **Zero Paid Subscriptions:** Operates completely out-of-the-box without OpenAI, Claude, Gemini, or paid vector databases. Built around an extensible `AIProvider` abstraction with a deterministic NLP `DemoAIProvider` and optional local `OllamaProvider`.
3. **Forensic Integrity by Default:** Automated SHA-256 byte hashing, EXIF camera sensor inspection, GPS extraction, and an immutable append-only audit trail.
4. **Apple-Level Restraint & Quiet Precision:** High information density without visual chaos. Dark charcoal palette (`#090D16`), crisp typography, restrained animations, and zero dead UI elements.

---

## 3. Core Capabilities & Modules

| Module | Forensic Capability | Technical Implementation |
| :--- | :--- | :--- |
| **Investigation Dossiers** | Full case lifecycle tracking (Draft, Active, Review, Closed), priority levels, team assignment. | SQLAlchemy models, case number generator (`SF-2026-001`). |
| **Evidence Vault** | Multi-file drag & drop ingestion, MIME validation, raw byte verification. | SHA-256 digest computation, local vault isolation. |
| **Forensic Pipeline** | Real sequential stage progression: `UPLOADED` → `HASHING` → `METADATA` → `TEXT/OCR` → `ENTITY_EXTRACTION` → `AI_ANALYSIS` → `COMPLETE`. | `ProcessingJob` state persistence and background execution. |
| **Metadata & EXIF** | Hardware make/model, embedded timestamps, GPS geotags, document authors. | Pillow EXIF parser, PyMuPDF header inspector. |
| **Media Authenticity** | Heuristic inspection of compression signatures, editor metadata, dimension ratios. | `MediaAuthenticityService` with transparent heuristic badges. |
| **Direct Text & OCR** | Plaintext, CSV, and PDF direct stream parsing; graceful Tesseract fallback. | `OCRService` detecting local binary availability. |
| **Intelligence Graph** | Interactive node-link graph mapping Persons, Devices, Accounts, Locations, Organizations. | React Flow interactive canvas with entity inspector drawer. |
| **Timeline Reconstruction**| Chronological event ordering correlated with source evidence anchors. | Filterable event stream with category tags. |
| **AI Findings & Review** | Structured hypotheses with confidence scores, analytical rationale, human review workflow. | State machine: `NEW` → `REVIEWED` → `CONFIRMED BY INVESTIGATOR` / `DISMISSED`. |
| **Explainable Risk** | Transparent composite risk index (0-100) based on weighted factors. | `RiskService` providing points breakdown per risk factor. |
| **Dossier Generation** | Formal investigative report export in PDF and JSON formats. | ReportLab automated PDF formatting and JSON serialization. |
| **Custody Audit Trail** | Immutable append-only record of all logins, uploads, views, reviews, and exports. | Tamper-evident `audit_logs` table without delete controls. |

---

## 4. End-to-End Demonstration Workflow

Sentinel Fusion is pre-seeded with a comprehensive synthetic forensic inquiry: **Operation Northstar (`SF-2026-001`)**.

Follow this seamless walkthrough:
1. **Sign In:** Open `http://localhost:3000/login`. Click the **Sarah Lin (Lead Inv.)** quick-fill button and submit.
2. **Dashboard Overview:** Review the 4 high-level metrics, active investigations, recent evidence stream, and priority AI findings.
3. **Open Operation Northstar:** Select `SF-2026-001` from the dashboard or investigations list.
4. **Inspect Evidence Vault:** Click the **Evidence** tab. Notice the 4 seized files (`financial_ledger_extract.csv`, `intercepted_memo.txt`, `surveillance_contact_photo.jpg`, `offshore_incorporation_deed.pdf`).
5. **View Evidence Detail:** Click **Inspect** on `surveillance_contact_photo.jpg`. Examine the visual preview, verified SHA-256 hash, extracted EXIF camera sensors (Sony Alpha 7 IV), GPS coordinates in Zurich, and media authenticity evaluation.
6. **Upload New File:** Return to Evidence and drop a new sample text or image file. Watch the real pipeline advance across all 5 stages.
7. **Reconstruct Timeline:** Switch to the **Timeline** tab. Filter by `TRANSACTION` or `COMMUNICATION` to view time-anchored events linked directly to source evidence.
8. **Explore Intelligence Graph:** Switch to the **Intelligence Graph** tab. Interact with the node-link graph. Click on target **Viktor Kozlov** to inspect his risk score (85/100) and relationships with **Northstar Holdings LLC** and **v.kozlov@protonmail.ch**.
9. **Review AI Findings:** Switch to the **AI Findings** tab. Review the high-severity finding *"Unsanctioned Capital Outflow via Layered Transfers"*. Click **Confirm Finding**, enter investigator verification notes, and submit.
10. **Assess Case Risk:** Observe how the case risk updates transparently based on confirmed factors and entity linkages.
11. **Generate Official Dossier:** Switch to the **Reports** tab. Click **Generate Dossier**, select **PDF Document**, and click **Compile & Seal Dossier**. Click **Download** to view the formatted dossier.
12. **Audit Verification:** Navigate to **Audit Log** in the sidebar to inspect the immutable chain-of-custody entry created for your report generation and finding confirmation actions.

---

## 5. Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript 5.4+
- **Styling:** Tailwind CSS (Restrained dark palette)
- **Icons:** Lucide React
- **Graph Visualization:** React Flow (`reactflow`)

### Backend
- **Framework:** FastAPI (Python 3.9+)
- **ORM & Database:** SQLAlchemy 2.0 with SQLite (local default) or PostgreSQL
- **Security:** Bcrypt password hashing, Python-Jose (JWT Bearer tokens)
- **Forensics & Media:** Pillow (PIL), PyMuPDF / standard binary parsers, hashlib
- **Document Generation:** ReportLab 4.0+ (Formal PDF dossiers)
- **Testing:** Pytest, HTTPX TestClient

---

## 6. Local Setup & Execution

### 1. Environment Configuration
```bash
cp .env.example .env
```

### 2. Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run seed script (creates demo users & Operation Northstar)
PYTHONPATH=. python app/seed.py

# Run test suite
PYTHONPATH=. pytest -v

# Launch backend
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`.

### 3. Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 7. Demo Credentials

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Demo Persona (Default)** | `demo@sentinelfusion.local` | `Password123!` | Full case ownership, evidence upload, finding review, dossier generation. |
| **Lead Investigator** | `lead.investigator@sentinel.local` | `Password123!` | Full case ownership, evidence upload, finding confirmation, report generation. |
| **Senior Analyst** | `analyst@sentinel.local` | `Password123!` | Evidence analysis, timeline anchoring, entity linking. |
| **System Administrator** | `admin@sentinel.local` | `Password123!` | Subsystem diagnostics, engine settings, global audit inspection. |

For detailed walkthrough steps and talking points, see the [Demonstration Guide (docs/demo.md)](docs/demo.md).

---

## 8. Technical Documentation Index
- [Architecture Specification (docs/architecture.md)](docs/architecture.md) &mdash; Detailed system design, pipeline mechanics, and security controls.
- [Database Schema (docs/database.md)](docs/database.md) &mdash; Relational schema with 11 normalized entities, constraints, and indexes.
- [REST API Specification (docs/api.md)](docs/api.md) &mdash; Complete request and response payloads with authentication standards.
- [Demonstration Walkthrough (docs/demo.md)](docs/demo.md) &mdash; 12-step guided scenario covering Operation Northstar (`SF-2026-001`).
- [Development & Operations Guide (docs/development.md)](docs/development.md) &mdash; Local environment setup, dependencies, and test execution.

---

## 9. Docker Deployment
Run the entire stack via Docker Compose:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`

---

## 10. Security & Evidentiary Compliance
- **Passphrase Security:** Salted Bcrypt hashing ensures passwords are never stored in plaintext.
- **Append-Only Auditing:** Custody records cannot be altered or purged through client interfaces.
- **Safe Vault Storage:** Seized filenames are mapped to internal UUIDs to prevent directory traversal and binary execution.
- **Transparent AI Disclaimer:** All AI summaries and risk calculations explicitly carry decision-support caveats.

---

## 11. Limitations & Future Roadmap
- **Offline OCR:** While OCR gracefully skips if Tesseract is not installed locally, future releases can bundle lightweight ONNX-based OCR runtimes.
- **Advanced Graph Layouts:** Future integration points exist for Neo4j backends for graphs exceeding 100,000 entities.
- **Cross-Case Matching:** Automated cross-investigation correlation across decentralized forensic databases.
