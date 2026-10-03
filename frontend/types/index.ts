export type Role = 'ADMIN' | 'INVESTIGATOR' | 'ANALYST';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
}

export type InvestigationStatus = 'DRAFT' | 'ACTIVE' | 'REVIEW' | 'CLOSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InvestigationMember {
  id: string;
  user_id: string;
  role_in_case: string;
  assigned_at: string;
  user: User;
}

export interface Investigation {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  status: InvestigationStatus;
  priority: Priority;
  lead_investigator_id: string;
  created_at: string;
  updated_at: string;
  evidence_count: number;
  findings_count: number;
  risk_score: number;
  lead_investigator?: User;
  members?: InvestigationMember[];
}

export type EvidenceStatus = 'UPLOADED' | 'PROCESSING' | 'ANALYZED' | 'ERROR';
export type ProcessingStage = 'UPLOADED' | 'HASHING' | 'METADATA' | 'TEXT_OCR' | 'ENTITY_EXTRACTION' | 'AI_ANALYSIS' | 'COMPLETE' | 'FAILED';
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface ProcessingJob {
  id: string;
  evidence_id: string;
  stage: ProcessingStage;
  status: JobStatus;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

export interface EvidenceMetadata {
  id: string;
  evidence_id: string;
  file_format?: string;
  width?: number;
  height?: number;
  created_date?: string;
  device_make?: string;
  device_model?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  author?: string;
  page_count?: number;
  extracted_text?: string;
  authenticity_score?: number;
  authenticity_notes?: string;
  raw_metadata_json?: string;
  created_at: string;
}

export interface Evidence {
  id: string;
  investigation_id: string;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  status: EvidenceStatus;
  processing_stage: ProcessingStage;
  uploaded_by_id: string;
  created_at: string;
  updated_at: string;
  uploaded_by?: User;
  metadata_record?: EvidenceMetadata;
  processing_jobs?: ProcessingJob[];
  findings?: Finding[];
}

export type EntityType = 'PERSON' | 'DEVICE' | 'ACCOUNT' | 'LOCATION' | 'EVIDENCE' | 'ORGANIZATION';
export type RelationshipType = 'OWNS' | 'USES' | 'COMMUNICATED_WITH' | 'LOCATED_AT' | 'ASSOCIATED_WITH' | 'APPEARS_IN';

export interface Entity {
  id: string;
  investigation_id: string;
  name: string;
  category: EntityType;
  risk_score: number;
  attributes_json?: string;
  created_at: string;
}

export interface Relationship {
  id: string;
  investigation_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  confidence: number;
  evidence_id?: string;
  description?: string;
  created_at: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: EntityType;
  risk_score: number;
  data: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  relationship_type: RelationshipType;
  confidence: number;
  description?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type EventCategory = 'COMMUNICATION' | 'TRANSACTION' | 'LOCATION' | 'ACCESS' | 'MEDIA' | 'GENERAL';

export interface TimelineEvent {
  id: string;
  investigation_id: string;
  evidence_id?: string;
  timestamp: string;
  title: string;
  description?: string;
  category: EventCategory;
  confidence: number;
  is_demo: boolean;
  created_at: string;
  evidence_title?: string;
}

export type FindingSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewStatus = 'NEW' | 'REVIEWED' | 'CONFIRMED' | 'DISMISSED';

export interface Finding {
  id: string;
  investigation_id: string;
  evidence_id?: string;
  title: string;
  summary: string;
  severity: FindingSeverity;
  confidence: number;
  review_status: ReviewStatus;
  reviewed_by_id?: string;
  reviewed_at?: string;
  review_notes?: string;
  explanation?: string;
  analysis_mode: string;
  created_at: string;
  evidence_title?: string;
  reviewed_by?: User;
}

export type RiskTier = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RiskFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
  evidence_ids: string[];
}

export interface RiskAssessment {
  id: string;
  investigation_id: string;
  overall_score: number;
  risk_tier: RiskTier;
  factors: RiskFactor[];
  assessment_mode: string;
  calculated_at: string;
}

export type ReportFormat = 'PDF' | 'JSON';

export interface Report {
  id: string;
  investigation_id: string;
  title: string;
  format: ReportFormat;
  file_size: number;
  generated_by_id: string;
  created_at: string;
  generated_by?: User;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CASE_CREATE'
  | 'CASE_UPDATE'
  | 'EVIDENCE_UPLOAD'
  | 'EVIDENCE_PROCESS'
  | 'EVIDENCE_VIEW'
  | 'FINDING_REVIEW'
  | 'REPORT_GENERATE'
  | 'ENTITY_CREATE'
  | 'RELATIONSHIP_CREATE'
  | 'TIMELINE_CREATE';

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  investigation_id?: string;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  details_json?: string;
  ip_address?: string;
  timestamp: string;
}

export interface SystemServiceStatus {
  name: string;
  status: string;
  details?: string;
}

export interface SystemStatus {
  database: SystemServiceStatus;
  backend: SystemServiceStatus;
  storage: SystemServiceStatus;
  ocr_engine: SystemServiceStatus;
  ai_provider: SystemServiceStatus;
  demo_mode: boolean;
  version: string;
}
