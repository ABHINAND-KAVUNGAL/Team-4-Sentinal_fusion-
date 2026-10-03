import json
from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.findings import Finding, FindingSeverity
from app.models.entities import Entity, Relationship
from app.models.evidence import Evidence, EvidenceMetadata
from app.models.risk import RiskAssessment, RiskTier

class RiskService:
    @staticmethod
    def calculate_investigation_risk(db: Session, investigation_id: str) -> Dict[str, Any]:
        """
        Calculates an explainable, deterministic risk index (0 - 100)
        based on active evidence, entity connectivity, and findings.
        """
        factors: List[Dict[str, Any]] = []
        total_score = 0

        # 1. High and Critical Findings Factor
        findings = db.query(Finding).filter(Finding.investigation_id == investigation_id).all()
        critical_count = sum(1 for f in findings if f.severity == FindingSeverity.CRITICAL)
        high_count = sum(1 for f in findings if f.severity == FindingSeverity.HIGH)
        
        findings_score = min(35, (critical_count * 15) + (high_count * 8))
        total_score += findings_score
        factors.append({
            "name": "Severe Investigative Findings",
            "weight": 35,
            "score": findings_score,
            "description": f"Identified {critical_count} critical and {high_count} high-severity AI-assisted findings across case evidence.",
            "evidence_ids": [f.evidence_id for f in findings if f.evidence_id and f.severity in (FindingSeverity.CRITICAL, FindingSeverity.HIGH)]
        })

        # 2. Entity Density and Cross-linkage Factor
        entities = db.query(Entity).filter(Entity.investigation_id == investigation_id).all()
        relationships = db.query(Relationship).filter(Relationship.investigation_id == investigation_id).all()
        high_risk_entities = sum(1 for e in entities if e.risk_score >= 60)

        entity_score = min(25, (len(relationships) * 3) + (high_risk_entities * 4))
        total_score += entity_score
        factors.append({
            "name": "Network Linkage & Suspect Density",
            "weight": 25,
            "score": entity_score,
            "description": f"{len(entities)} tracked entities connected via {len(relationships)} confirmed or potential relationships ({high_risk_entities} elevated-risk targets).",
            "evidence_ids": []
        })

        # 3. Media Authenticity / Tampering Discrepancies
        evidence_list = db.query(Evidence).filter(Evidence.investigation_id == investigation_id).all()
        evidence_ids = [e.id for e in evidence_list]
        metadata_list = db.query(EvidenceMetadata).filter(EvidenceMetadata.evidence_id.in_(evidence_ids)).all() if evidence_ids else []
        
        tamper_flags = [m for m in metadata_list if m.authenticity_score and m.authenticity_score >= 0.5]
        authenticity_score = min(20, len(tamper_flags) * 10)
        total_score += authenticity_score
        factors.append({
            "name": "Digital Authenticity & Integrity Flags",
            "weight": 20,
            "score": authenticity_score,
            "description": f"{len(tamper_flags)} media items triggered heuristic compression or metadata alteration indicators.",
            "evidence_ids": [m.evidence_id for m in tamper_flags]
        })

        # 4. Critical Communication & Operational Security Indicators
        opsec_findings = [f for f in findings if "evasion" in f.title.lower() or "operational security" in f.title.lower() or "unsanctioned" in f.title.lower()]
        opsec_score = min(20, len(opsec_findings) * 10)
        total_score += opsec_score
        factors.append({
            "name": "Operational Evasion & Channel Encryption",
            "weight": 20,
            "score": opsec_score,
            "description": f"{len(opsec_findings)} documented instances of counter-surveillance or encrypted asset relocation.",
            "evidence_ids": [f.evidence_id for f in opsec_findings if f.evidence_id]
        })

        # Cap total score at 100
        overall = min(100, max(0, total_score))

        # Determine Tier
        if overall >= 80:
            tier = RiskTier.CRITICAL
        elif overall >= 60:
            tier = RiskTier.HIGH
        elif overall >= 30:
            tier = RiskTier.MODERATE
        else:
            tier = RiskTier.LOW

        # Persist or update RiskAssessment record
        existing = db.query(RiskAssessment).filter(RiskAssessment.investigation_id == investigation_id).first()
        if existing:
            existing.overall_score = overall
            existing.risk_tier = tier
            existing.factors_json = json.dumps(factors)
            existing.calculated_at = datetime.utcnow()
            db.commit()
            db.refresh(existing)
            assessment = existing
        else:
            assessment = RiskAssessment(
                investigation_id=investigation_id,
                overall_score=overall,
                risk_tier=tier,
                factors_json=json.dumps(factors),
                assessment_mode="HEURISTIC_EXPLAINABLE"
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

        return {
            "id": assessment.id,
            "investigation_id": investigation_id,
            "overall_score": overall,
            "risk_tier": tier,
            "factors": factors,
            "assessment_mode": "HEURISTIC_EXPLAINABLE (Transparent Weighted Model)",
            "calculated_at": assessment.calculated_at
        }
