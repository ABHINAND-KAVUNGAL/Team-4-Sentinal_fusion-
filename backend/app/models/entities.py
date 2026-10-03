import uuid
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class EntityType(str, Enum):
    PERSON = "PERSON"
    DEVICE = "DEVICE"
    ACCOUNT = "ACCOUNT"
    LOCATION = "LOCATION"
    EVIDENCE = "EVIDENCE"
    ORGANIZATION = "ORGANIZATION"

class RelationshipType(str, Enum):
    OWNS = "OWNS"
    USES = "USES"
    COMMUNICATED_WITH = "COMMUNICATED_WITH"
    LOCATED_AT = "LOCATED_AT"
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    APPEARS_IN = "APPEARS_IN"

class Entity(Base):
    __tablename__ = "entities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(SQLEnum(EntityType), nullable=False, index=True)
    risk_score = Column(Integer, default=0, nullable=False)
    attributes_json = Column(Text, nullable=True)  # JSON-encoded key-value attributes
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    investigation = relationship("Investigation", back_populates="entities")
    outgoing_relationships = relationship("Relationship", foreign_keys="Relationship.source_entity_id", back_populates="source_entity", cascade="all, delete-orphan")
    incoming_relationships = relationship("Relationship", foreign_keys="Relationship.target_entity_id", back_populates="target_entity", cascade="all, delete-orphan")

class Relationship(Base):
    __tablename__ = "relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    investigation_id = Column(String(36), ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False, index=True)
    source_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    target_entity_id = Column(String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(SQLEnum(RelationshipType), nullable=False)
    confidence = Column(Float, default=1.0, nullable=False)  # 0.0 - 1.0
    evidence_id = Column(String(36), ForeignKey("evidence.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    investigation = relationship("Investigation", back_populates="relationships")
    source_entity = relationship("Entity", foreign_keys=[source_entity_id], back_populates="outgoing_relationships")
    target_entity = relationship("Entity", foreign_keys=[target_entity_id], back_populates="incoming_relationships")
    evidence = relationship("Evidence")
