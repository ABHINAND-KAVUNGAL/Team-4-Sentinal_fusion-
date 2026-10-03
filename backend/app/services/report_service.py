import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.models.investigations import Investigation
from app.models.evidence import Evidence
from app.models.findings import Finding
from app.models.entities import Entity, Relationship
from app.models.timeline import TimelineEvent
from app.models.risk import RiskAssessment
from app.models.reports import Report, ReportFormat
from app.models.audit import AuditLog, AuditAction
from app.services.audit_service import AuditService
from app.config import settings

class ReportService:
    @classmethod
    def generate_report(
        cls,
        db: Session,
        investigation_id: str,
        user,
        format_type: ReportFormat = ReportFormat.PDF,
        title: str = None
    ) -> Report:
        investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
        if not investigation:
            raise ValueError("Investigation not found")

        report_dir = os.path.join(settings.STORAGE_PATH, "reports")
        os.makedirs(report_dir, exist_ok=True)

        timestamp_str = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        report_title = title or f"Dossier_{investigation.case_number}_{timestamp_str}"
        report_id = str(uuid.uuid4())

        if format_type == ReportFormat.JSON:
            filename = f"{report_id}.json"
            filepath = os.path.join(report_dir, filename)
            cls._generate_json(db, investigation, filepath)
        else:
            filename = f"{report_id}.pdf"
            filepath = os.path.join(report_dir, filename)
            cls._generate_pdf(db, investigation, filepath, user)

        file_size = os.path.getsize(filepath)

        report = Report(
            id=report_id,
            investigation_id=investigation.id,
            title=report_title,
            format=format_type,
            file_path=filepath,
            file_size=file_size,
            generated_by_id=user.id
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        AuditService.log(
            db=db,
            action=AuditAction.REPORT_GENERATE,
            resource_type="report",
            resource_id=report.id,
            investigation_id=investigation.id,
            user=user,
            details={"title": report_title, "format": format_type.value, "size_bytes": file_size}
        )

        return report

    @classmethod
    def _generate_json(cls, db: Session, investigation: Investigation, filepath: str):
        evidence_list = db.query(Evidence).filter(Evidence.investigation_id == investigation.id).all()
        findings = db.query(Finding).filter(Finding.investigation_id == investigation.id).all()
        timeline = db.query(TimelineEvent).filter(TimelineEvent.investigation_id == investigation.id).order_by(TimelineEvent.timestamp.asc()).all()
        risk = db.query(RiskAssessment).filter(RiskAssessment.investigation_id == investigation.id).first()
        audit = db.query(AuditLog).filter(AuditLog.investigation_id == investigation.id).order_by(AuditLog.timestamp.desc()).limit(50).all()

        data = {
            "case_number": investigation.case_number,
            "title": investigation.title,
            "description": investigation.description,
            "status": investigation.status.value,
            "priority": investigation.priority.value,
            "lead_investigator": investigation.lead_investigator.full_name if investigation.lead_investigator else None,
            "created_at": investigation.created_at.isoformat(),
            "exported_at": datetime.utcnow().isoformat(),
            "risk_assessment": {
                "score": risk.overall_score if risk else 0,
                "tier": risk.risk_tier.value if risk else "LOW",
                "factors": json.loads(risk.factors_json) if (risk and risk.factors_json) else []
            },
            "evidence": [
                {
                    "id": e.id,
                    "title": e.title,
                    "original_filename": e.original_filename,
                    "mime_type": e.mime_type,
                    "file_size": e.file_size,
                    "sha256": e.sha256_hash,
                    "status": e.status.value,
                    "stage": e.processing_stage.value,
                    "created_at": e.created_at.isoformat()
                } for e in evidence_list
            ],
            "findings": [
                {
                    "id": f.id,
                    "title": f.title,
                    "summary": f.summary,
                    "severity": f.severity.value,
                    "confidence": f.confidence,
                    "review_status": f.review_status.value,
                    "explanation": f.explanation,
                    "analysis_mode": f.analysis_mode
                } for f in findings
            ],
            "timeline": [
                {
                    "timestamp": t.timestamp.isoformat(),
                    "title": t.title,
                    "description": t.description,
                    "category": t.category.value,
                    "confidence": t.confidence
                } for t in timeline
            ],
            "audit_trail": [
                {
                    "timestamp": a.timestamp.isoformat(),
                    "user_email": a.user_email,
                    "action": a.action.value,
                    "resource": a.resource_type
                } for a in audit
            ]
        }

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    @classmethod
    def _generate_pdf(cls, db: Session, investigation: Investigation, filepath: str, user):
        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        # Professional restrained palette
        c_primary = colors.HexColor("#0F172A")
        c_accent = colors.HexColor("#2563EB")
        c_muted = colors.HexColor("#475569")
        c_bg = colors.HexColor("#F8FAFC")
        c_border = colors.HexColor("#CBD5E1")

        title_style = ParagraphStyle(
            "DocTitle",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            textColor=c_primary
        )

        subtitle_style = ParagraphStyle(
            "DocSubtitle",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=14,
            textColor=c_muted
        )

        h1_style = ParagraphStyle(
            "SectionH1",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=13,
            leading=17,
            textColor=c_primary,
            spaceBefore=12,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            "DocBody",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#1E293B")
        )

        table_header_style = ParagraphStyle(
            "THeader",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=11,
            textColor=colors.white
        )

        table_cell_style = ParagraphStyle(
            "TCell",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#1E293B")
        )

        story = []

        # Top Header Banner
        header_table = Table([
            [
                Paragraph("<b>SENTINEL FUSION</b> | DIGITAL FORENSIC DOSSIER", title_style),
                Paragraph(f"CASE: <b>{investigation.case_number}</b><br/>CONFIDENTIAL", ParagraphStyle("RightH", parent=subtitle_style, alignment=TA_RIGHT))
            ]
        ], colWidths=[380, 160])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(header_table)
        story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=0, spaceAfter=10))

        # Case Summary Box
        case_info = [
            [
                Paragraph(f"<b>Title:</b> {investigation.title}", body_style),
                Paragraph(f"<b>Status:</b> {investigation.status.value}", body_style),
                Paragraph(f"<b>Priority:</b> {investigation.priority.value}", body_style)
            ],
            [
                Paragraph(f"<b>Lead Investigator:</b> {investigation.lead_investigator.full_name if investigation.lead_investigator else 'Unassigned'}", body_style),
                Paragraph(f"<b>Generated By:</b> {user.full_name}", body_style),
                Paragraph(f"<b>Timestamp:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", body_style)
            ]
        ]
        info_table = Table(case_info, colWidths=[200, 170, 170])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), c_bg),
            ('BOX', (0,0), (-1,-1), 1, c_border),
            ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(info_table)
        story.append(Spacer(1, 10))

        # Risk Assessment Overview
        risk = db.query(RiskAssessment).filter(RiskAssessment.investigation_id == investigation.id).first()
        story.append(Paragraph("1. INVESTIGATIVE RISK ASSESSMENT", h1_style))
        risk_score = risk.overall_score if risk else 0
        risk_tier = risk.risk_tier.value if risk else "LOW"
        risk_color = colors.HexColor("#DC2626") if risk_tier in ("CRITICAL", "HIGH") else colors.HexColor("#D97706")
        
        risk_summary = f"<b>Assessed Risk Level:</b> <font color='{risk_color.hexval()}'><b>{risk_score}/100 ({risk_tier})</b></font> &nbsp;&nbsp;|&nbsp;&nbsp; <i>Mode: Heuristic / Decision-Support</i>"
        story.append(Paragraph(risk_summary, body_style))
        story.append(Spacer(1, 4))

        if risk and risk.factors_json:
            factors = json.loads(risk.factors_json)
            risk_rows = [[Paragraph("Risk Factor", table_header_style), Paragraph("Points", table_header_style), Paragraph("Analysis & Description", table_header_style)]]
            for f in factors:
                risk_rows.append([
                    Paragraph(f"<b>{f.get('name')}</b>", table_cell_style),
                    Paragraph(f"{f.get('score')}/{f.get('weight')}", table_cell_style),
                    Paragraph(f.get('description', ''), table_cell_style)
                ])
            risk_table = Table(risk_rows, colWidths=[140, 50, 350])
            risk_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), c_primary),
                ('GRID', (0,0), (-1,-1), 0.5, c_border),
                ('TOPPADDING', (0,0), (-1,-1), 4),
                ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(risk_table)

        story.append(Spacer(1, 10))

        # Evidence Inventory
        story.append(Paragraph("2. EVIDENCE INVENTORY & INTEGRITY VERIFICATION", h1_style))
        evidence_list = db.query(Evidence).filter(Evidence.investigation_id == investigation.id).all()
        ev_rows = [[
            Paragraph("Item", table_header_style),
            Paragraph("Original Filename", table_header_style),
            Paragraph("Type / Size", table_header_style),
            Paragraph("SHA-256 Hash", table_header_style),
            Paragraph("Status", table_header_style)
        ]]
        for idx, ev in enumerate(evidence_list, 1):
            size_kb = f"{round(ev.file_size / 1024, 1)} KB"
            hash_display = f"{ev.sha256_hash[:16]}...{ev.sha256_hash[-8:]}"
            ev_rows.append([
                Paragraph(str(idx), table_cell_style),
                Paragraph(f"<b>{ev.original_filename}</b>", table_cell_style),
                Paragraph(f"{ev.mime_type.split('/')[-1]}<br/>{size_kb}", table_cell_style),
                Paragraph(f"<font face='Courier' size='7'>{hash_display}</font>", table_cell_style),
                Paragraph(f"{ev.status.value}", table_cell_style)
            ])
        ev_table = Table(ev_rows, colWidths=[30, 160, 90, 190, 70])
        ev_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(ev_table)

        story.append(Spacer(1, 10))

        # AI-Assisted Findings & Review Status
        story.append(Paragraph("3. AI-ASSISTED FINDINGS & INVESTIGATOR VERIFICATION", h1_style))
        findings = db.query(Finding).filter(Finding.investigation_id == investigation.id).all()
        find_rows = [[
            Paragraph("Finding", table_header_style),
            Paragraph("Severity", table_header_style),
            Paragraph("Confidence", table_header_style),
            Paragraph("Review Status", table_header_style),
            Paragraph("Investigative Summary", table_header_style)
        ]]
        for f in findings:
            status_text = "CONFIRMED BY INVESTIGATOR" if f.review_status.value == "CONFIRMED" else f.review_status.value
            notes_text = f"<br/><font color='#16A34A'><b>Investigator Notes:</b> {f.review_notes}</font>" if f.review_notes else ""
            find_rows.append([
                Paragraph(f"<b>{f.title}</b>", table_cell_style),
                Paragraph(f.severity.value, table_cell_style),
                Paragraph(f"{int(f.confidence * 100)}%", table_cell_style),
                Paragraph(f"<b>{status_text}</b>", table_cell_style),
                Paragraph(f"{f.summary}<br/><i>{f.explanation or ''}</i>{notes_text}", table_cell_style)
            ])
        find_table = Table(find_rows, colWidths=[120, 60, 60, 80, 220])
        find_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(find_table)

        story.append(Spacer(1, 12))

        # 4. Extracted Intelligence Entities & Network Linkages
        story.append(Paragraph("4. EXTRACTED INTELLIGENCE ENTITIES & NETWORK LINKAGES", h1_style))
        entities = db.query(Entity).filter(Entity.investigation_id == investigation.id).all()
        relationships = db.query(Relationship).filter(Relationship.investigation_id == investigation.id).all()

        ent_rows = [[
            Paragraph("Entity Name", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Risk", table_header_style),
            Paragraph("Correlated Associations", table_header_style)
        ]]
        for e in entities[:12]:
            # Count connected relationships
            rel_count = sum(1 for r in relationships if r.source_entity_id == e.id or r.target_entity_id == e.id)
            ent_rows.append([
                Paragraph(f"<b>{e.name}</b>", table_cell_style),
                Paragraph(e.category.value, table_cell_style),
                Paragraph(f"{e.risk_score}/100", table_cell_style),
                Paragraph(f"{rel_count} link(s) across case network", table_cell_style)
            ])
        ent_table = Table(ent_rows, colWidths=[160, 90, 60, 230])
        ent_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(ent_table)

        story.append(Spacer(1, 12))

        # 5. Chronological Incident Timeline
        story.append(Paragraph("5. CHRONOLOGICAL INCIDENT TIMELINE", h1_style))
        events = db.query(TimelineEvent).filter(TimelineEvent.investigation_id == investigation.id).order_by(TimelineEvent.timestamp.asc()).all()
        time_rows = [[
            Paragraph("Timestamp (UTC)", table_header_style),
            Paragraph("Category", table_header_style),
            Paragraph("Event Title & Analytical Observation", table_header_style)
        ]]
        for ev in events[:12]:
            ts_str = ev.timestamp.strftime("%Y-%m-%d %H:%M")
            time_rows.append([
                Paragraph(ts_str, table_cell_style),
                Paragraph(ev.category.value, table_cell_style),
                Paragraph(f"<b>{ev.title}</b><br/>{ev.description or ''}", table_cell_style)
            ])
        time_table = Table(time_rows, colWidths=[100, 90, 350])
        time_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(time_table)

        story.append(Spacer(1, 12))

        # 6. Chain of Custody & Audit Verification Trail
        story.append(Paragraph("6. CHAIN OF CUSTODY & AUDIT VERIFICATION TRAIL", h1_style))
        audits = db.query(AuditLog).filter(AuditLog.investigation_id == investigation.id).order_by(AuditLog.timestamp.desc()).limit(10).all()
        audit_rows = [[
            Paragraph("Timestamp (UTC)", table_header_style),
            Paragraph("Operator Account", table_header_style),
            Paragraph("Action", table_header_style),
            Paragraph("Resource", table_header_style)
        ]]
        for a in audits:
            ts_str = a.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            audit_rows.append([
                Paragraph(ts_str, table_cell_style),
                Paragraph(a.user_email or "System", table_cell_style),
                Paragraph(f"<b>{a.action.value}</b>", table_cell_style),
                Paragraph(f"{a.resource_type or ''} ({a.resource_id[:8] if a.resource_id else ''})", table_cell_style)
            ])
        audit_table = Table(audit_rows, colWidths=[110, 160, 130, 140])
        audit_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), c_primary),
            ('GRID', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 5),
            ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ]))
        story.append(audit_table)

        story.append(Spacer(1, 14))

        # Legal & AI Disclaimer Notice
        notice_text = (
            "<b>NOTICE & LEGAL CAVEAT:</b> This intelligence dossier was assembled using Sentinel Fusion. "
            "All automated NLP summaries, entity correlations, media authenticity scores, and risk values "
            "are AI-assisted decision-support heuristics and do NOT constitute legal proof or automated judicial determination. "
            "All findings require independent corroboration and human investigator review."
        )
        notice_para = Paragraph(notice_text, ParagraphStyle("Notice", parent=body_style, fontSize=7.5, leading=10, textColor=c_muted))
        notice_box = Table([[notice_para]], colWidths=[540])
        notice_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#F1F5F9")),
            ('BOX', (0,0), (-1,-1), 0.5, c_border),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(notice_box)

        doc.build(story)
