from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.models.entities import EntityType, RelationshipType

class EntityCreate(BaseModel):
    name: str
    category: EntityType
    risk_score: int = 0
    attributes: Optional[Dict[str, Any]] = None

class EntityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    name: str
    category: EntityType
    risk_score: int
    attributes_json: Optional[str] = None
    created_at: datetime

class RelationshipCreate(BaseModel):
    source_entity_id: str
    target_entity_id: str
    relationship_type: RelationshipType
    confidence: float = 1.0
    evidence_id: Optional[str] = None
    description: Optional[str] = None

class RelationshipResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    investigation_id: str
    source_entity_id: str
    target_entity_id: str
    relationship_type: RelationshipType
    confidence: float
    evidence_id: Optional[str] = None
    description: Optional[str] = None
    created_at: datetime

class GraphNode(BaseModel):
    id: str
    label: str
    type: str
    category: EntityType
    risk_score: int
    data: Dict[str, Any]

class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    label: str
    relationship_type: RelationshipType
    confidence: float
    description: Optional[str] = None

class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]
