import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.users import User
from app.models.investigations import Investigation
from app.models.entities import Entity, Relationship, EntityType, RelationshipType
from app.models.audit import AuditAction
from app.schemas.entity import (
    EntityCreate, EntityResponse, RelationshipCreate, RelationshipResponse,
    GraphResponse, GraphNode, GraphEdge
)
from app.services.audit_service import AuditService
from app.services.risk_service import RiskService
from app.api.deps import get_current_user

router = APIRouter(tags=["Intelligence Graph"])

@router.get("/investigations/{investigation_id}/graph", response_model=GraphResponse)
def get_investigation_graph(
    investigation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    entities = db.query(Entity).filter(Entity.investigation_id == investigation_id).all()
    relationships = db.query(Relationship).filter(Relationship.investigation_id == investigation_id).all()

    nodes: List[GraphNode] = []
    for ent in entities:
        attrs = json.loads(ent.attributes_json) if ent.attributes_json else {}
        nodes.append(GraphNode(
            id=ent.id,
            label=ent.name,
            type="forensicNode",
            category=ent.category,
            risk_score=ent.risk_score,
            data={
                "name": ent.name,
                "category": ent.category.value,
                "risk_score": ent.risk_score,
                "attributes": attrs,
                "created_at": ent.created_at.isoformat()
            }
        ))

    edges: List[GraphEdge] = []
    for rel in relationships:
        edges.append(GraphEdge(
            id=rel.id,
            source=rel.source_entity_id,
            target=rel.target_entity_id,
            label=rel.relationship_type.value.replace("_", " "),
            relationship_type=rel.relationship_type,
            confidence=rel.confidence,
            description=rel.description
        ))

    return GraphResponse(nodes=nodes, edges=edges)

@router.post("/investigations/{investigation_id}/entities", response_model=EntityResponse, status_code=status.HTTP_201_CREATED)
def create_entity(
    investigation_id: str,
    ent_data: EntityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    ent = Entity(
        investigation_id=investigation_id,
        name=ent_data.name,
        category=ent_data.category,
        risk_score=ent_data.risk_score,
        attributes_json=json.dumps(ent_data.attributes or {})
    )
    db.add(ent)
    db.commit()
    db.refresh(ent)

    RiskService.calculate_investigation_risk(db, investigation_id)

    AuditService.log(
        db=db,
        action=AuditAction.ENTITY_CREATE,
        resource_type="entity",
        resource_id=ent.id,
        investigation_id=investigation_id,
        user=current_user,
        details={"name": ent.name, "category": ent.category.value}
    )

    return ent

@router.post("/investigations/{investigation_id}/relationships", response_model=RelationshipResponse, status_code=status.HTTP_201_CREATED)
def create_relationship(
    investigation_id: str,
    rel_data: RelationshipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation not found")

    source = db.query(Entity).filter(Entity.id == rel_data.source_entity_id, Entity.investigation_id == investigation_id).first()
    target = db.query(Entity).filter(Entity.id == rel_data.target_entity_id, Entity.investigation_id == investigation_id).first()
    if not source or not target:
        raise HTTPException(status_code=400, detail="Source or target entity not found in this investigation")

    rel = Relationship(
        investigation_id=investigation_id,
        source_entity_id=rel_data.source_entity_id,
        target_entity_id=rel_data.target_entity_id,
        relationship_type=rel_data.relationship_type,
        confidence=rel_data.confidence,
        evidence_id=rel_data.evidence_id,
        description=rel_data.description
    )
    db.add(rel)
    db.commit()
    db.refresh(rel)

    RiskService.calculate_investigation_risk(db, investigation_id)

    AuditService.log(
        db=db,
        action=AuditAction.RELATIONSHIP_CREATE,
        resource_type="relationship",
        resource_id=rel.id,
        investigation_id=investigation_id,
        user=current_user,
        details={"source": source.name, "target": target.name, "type": rel.relationship_type.value}
    )

    return rel
