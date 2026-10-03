# Sentinel Fusion &mdash; Complete Demonstration Walkthrough Guide

This document provides a comprehensive, step-by-step demonstration guide for **Sentinel Fusion**, an AI-Assisted Digital Intelligence Fusion Platform for Digital Forensics & Investigations.

---

## 1. Demonstration Narrative & Scenario Overview

**Operation Name:** Operation Northstar  
**Case Identifier:** `SF-2026-001`  
**Classification:** SENSITIVE &bull; LAW ENFORCEMENT INTELLIGENCE  
**Scenario Summary:**  
A coordinated multi-jurisdictional financial crime and counter-surveillance inquiry into suspect **Viktor Kozlov**, alleged associate **Elena Rostova**, and shell entity **Northstar Holdings LLC**. Evidence seized from digital searches, intercepted memos, covert photography, and offshore incorporation records must be analyzed, correlated into a relationship graph, chronologically ordered on a timeline, assessed for operational risk, confirmed by an investigator, and compiled into a sealed PDF/JSON dossier.

---

## 2. Seeded Personas & Authentication Credentials

| Persona | Email | Passphrase | System Role | Recommended For |
| :--- | :--- | :--- | :--- | :--- |
| **Demo Persona** | `demo@sentinelfusion.local` | `Password123!` | Lead Investigator | Evaluator Walkthrough (Default) |
| **Sarah Lin** | `lead.investigator@sentinel.local` | `Password123!` | Lead Investigator | Case Ownership & Approvals |
| **Marcus Vance** | `analyst@sentinel.local` | `Password123!` | Senior Analyst | Evidence Ingestion & Graph Analysis |
| **System Admin** | `admin@sentinel.local` | `Password123!` | Administrator | Engine Health & Subsystems |

---

## 3. Step-by-Step Demonstration Workflow

Follow this exact 12-step sequence to demonstrate the complete platform capabilities:

### Step 1: Secure Operator Login
1. Open `http://localhost:3000/login` in your web browser.
2. Click the quick-fill button **Demo Persona** (`demo@sentinelfusion.local`).
3. Click **Sign In to Platform**.
4. *Talking Point:* Authentication uses salted Bcrypt password verification and cryptographically signed JWT Bearer session tokens. Every sign-in is audited to the append-only custody log.

### Step 2: Investigation Intelligence Dashboard
1. The dashboard opens displaying the core operational banner: *"Connect evidence. Understand relationships. Investigate with clarity."*
2. Observe the 4 primary operational metric cards:
   - **Active Cases**
   - **Evidence Vault Items**
   - **AI Findings**
   - **High-Priority Cases**
3. Review the **Priority AI Findings** stream and **Recent Custody Audit** events.
4. *Talking Point:* High information density without visual chaos. All metrics are computed dynamically from backend SQL queries.

### Step 3: Open Case Dossier (Operation Northstar)
1. Select **SF-2026-001 [Operation Northstar]** from Recent Cases or click **Investigations** in the sidebar.
2. The Case Workspace loads with the case header:
   - Case ID: `SF-2026-001`
   - Status: `ACTIVE`
   - Priority: `HIGH`
   - Lead Investigator: `Sarah Lin`
3. View the **Executive Intelligence Briefing** detailing the multi-jurisdictional inquiry scope and target entities.

### Step 4: Evidence Vault & Cryptographic Integrity
1. Click the **Evidence** tab in the case navigation.
2. Notice the seized files currently stored in the isolated vault:
   - `financial_ledger_extract.csv`
   - `intercepted_memo.txt`
   - `surveillance_contact_photo.jpg`
   - `offshore_incorporation_deed.pdf`
3. Inspect the verified 64-character **SHA-256 cryptographic hashes** and pipeline stage (`COMPLETE`).
4. *Talking Point:* Every seized item is hashed using raw byte digests upon ingestion. Hashes are computed via Python's standard `hashlib`, preventing evidentiary tampering.

### Step 5: Detailed Evidence Inspection (EXIF, GPS & Media Authenticity)
1. Click **Inspect** on `surveillance_contact_photo.jpg`.
2. Review the multi-panel forensic view:
   - **Visual Image Preview:** Shows the high-resolution seized raster image.
   - **Hardware Camera Sensor:** Extracted via Pillow EXIF parser (`Sony Alpha 7 IV`).
   - **Geographic Coordinates:** Extracted GPS latitude (`47.3769`) and longitude (`8.5417`) located in Zurich, Switzerland.
   - **Media Authenticity Assessment:** Evaluates compression consistency, editing software signatures, and raster dimensions (`82% - Analysis mode: Demonstration / heuristic`).
   - **Chain of Custody Stream:** Shows timestamps for upload, hash verification, metadata parsing, and inspector views.
3. *Talking Point:* The platform transparently labels heuristic analysis and never misrepresents deterministic rules as proprietary neural networks.

### Step 6: Live Evidence Ingestion & 5-Stage Pipeline Engine
1. Click **Back to Evidence Repository**.
2. Drag and drop any sample text file (`.txt`, `.csv`, `.json`, or `.jpg`) into the dropzone.
3. Observe the sequential backend pipeline stages advance:
   `UPLOADED` &rarr; `HASHING` &rarr; `METADATA` &rarr; `TEXT/OCR` &rarr; `ENTITY EXTRACTION` &rarr; `AI ANALYSIS` &rarr; `COMPLETE`.
4. *Talking Point:* Real asynchronous state progression tracked in the `processing_jobs` table.

### Step 7: Chronological Timeline Reconstruction
1. Click the **Timeline** tab.
2. Observe time-anchored events reconstructed chronologically:
   - Wire transfers ($1,450,000 capital flight)
   - Cryptocurrency cold vault conversion
   - Intercepted encrypted directives
   - Observed physical rendezvous in Zurich
3. Filter the timeline by category (`TRANSACTION`, `COMMUNICATION`, `LOCATION`).
4. Click an event to view details and inspect its supporting evidence anchor.

### Step 8: Interactive Intelligence Graph
1. Click the **Intelligence Graph** tab.
2. Interact with the React Flow node-link canvas (pan, zoom, reset).
3. Observe node types color-coded by category:
   - **Persons:** Viktor Kozlov (Suspect, Risk 85), Elena Rostova (Associate, Risk 68).
   - **Organizations:** Northstar Holdings LLC, Meridian Logistics AG.
   - **Accounts:** Ethereum Cold Vault (`0x71C8...`), Swiss Encrypted Mail (`v.kozlov@protonmail.ch`).
   - **Locations:** Zurich Logistics Depot.
   - **Devices:** Sony Alpha 7 IV.
4. Filter by entity category (e.g. `PERSON` or `ACCOUNT`).
5. Click on **Viktor Kozlov** to open the **Target Inspector Drawer** displaying his direct connections, risk score (85/100), and linked evidence files.

### Step 9: AI Findings & Human Investigator Review Workflow
1. Click the **AI Findings** tab.
2. Review the structured intelligence findings:
   - *"Operational Security and Concealment Indicators"* (Confidence: 88%)
   - *"Potential Unsanctioned Financial Movement"* (Confidence: 84%)
3. Review the **Analytical Rationale** explaining keyword triggers and transactional evidence.
4. Click **Confirm Finding** on an unconfirmed item:
   - Select confirmation status: `CONFIRMED BY INVESTIGATOR`.
   - Enter investigator notes: *"Corroborated by Lead Investigator Sarah Lin via cross-referenced Swiss financial ledgers."*
   - Submit review.
5. Notice the status badge immediately updates to **CONFIRMED BY INVESTIGATOR**.
6. *Talking Point:* AI is an assistant, not an autonomous arbiter. Legally definitive evidentiary confirmation strictly requires human investigator sign-off.

### Step 10: Explainable Risk Assessment
1. Click the **Overview** tab or check the Case Risk card.
2. Observe the composite Case Risk Index (e.g., `90 / 100 [CRITICAL]`).
3. Expand or review the **Contributing Factors Breakdown**:
   - Severe Investigative Findings (+35/35 pts)
   - Network Linkage & Suspect Density (+25/25 pts)
   - Digital Authenticity & Integrity Flags (+10/20 pts)
   - Operational Evasion & Channel Encryption (+20/20 pts)
4. *Talking Point:* Completely transparent arithmetic model without black-box scoring.

### Step 11: Formal Dossier Compilation (PDF & JSON)
1. Click the **Reports** tab.
2. Click **Generate Dossier**.
3. Select **PDF Document**, enter a title or use the default, and click **Compile & Seal Dossier**.
4. Click **Download** on the newly compiled dossier.
5. Inspect the generated PDF:
   - Formal law enforcement header & case numbers
   - Evidence inventory with SHA-256 digests
   - Chronological timeline table
   - Confirmed findings and analytical explanations
   - Risk assessment factor breakdown
   - Tamper-evident custody trail
6. Switch format to **JSON** to generate a structured forensic machine-readable export.

### Step 12: Chain of Custody & Subsystem Diagnostics
1. Click **Audit Log** in the sidebar.
2. Verify that all actions performed during the demonstration (`LOGIN`, `EVIDENCE_UPLOAD`, `EVIDENCE_PROCESS`, `FINDING_REVIEW`, `REPORT_GENERATE`) are recorded with timestamps, operator emails, and resource IDs.
3. Click **Settings** in the sidebar.
4. Observe real-time diagnostics:
   - **Database Engine:** `OPERATIONAL` (Connected SQLite)
   - **Backend Service:** `OPERATIONAL` (FastAPI v1.0.0)
   - **Storage Vault:** `OPERATIONAL` (Local Vault Path)
   - **OCR Engine:** `AVAILABLE` (or gracefully labeled if Tesseract is uninstalled)
   - **AI Provider:** `OPERATIONAL` (Demo Analysis deterministic rules)
