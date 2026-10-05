# Sentinel Fusion -- Technology Stack (2026)

## Overview

Sentinel Fusion is an AI-native digital forensics and intelligence
fusion platform. The recommended stack prioritizes scalability,
security, explainability, and seamless AI integration while remaining
suitable for both an MVP and enterprise deployment.

------------------------------------------------------------------------

# Architecture

``` text
                Next.js Frontend
                       │
            Authentication (Clerk/Auth.js)
                       │
                 FastAPI Backend
                       │
      ┌──────────┬──────────┬──────────────┐
      │          │          │              │
 PostgreSQL   Neo4j      Redis        Object Storage
      │          │          │              │
      └──────── AI Processing Workers ─────┘
              OCR • Vision • LLM • Speech
```

------------------------------------------------------------------------

# Frontend

## Framework

**Next.js 16 (React 20)**

### Why

-   Excellent for dashboard-heavy applications
-   Server Components improve performance
-   App Router simplifies routing
-   Great developer experience
-   Mature ecosystem

## Styling

**Tailwind CSS 5**

### Why

-   Rapid UI development
-   Easy theming
-   Lightweight and modern

## UI Components

**shadcn/ui**

### Why

-   Accessible components
-   Professional dashboard design
-   Highly customizable

## Icons

**Lucide Icons**

## Graph Visualization

-   React Flow
-   Cytoscape.js

Used for evidence relationship mapping and intelligence graphs.

## Timeline

**vis-timeline**

## Maps

**MapLibre**

## Charts

**Apache ECharts**

------------------------------------------------------------------------

# Backend

## Framework

**FastAPI (Python)**

### Why

-   Native access to AI libraries
-   High performance
-   Async support
-   Automatic OpenAPI documentation
-   Excellent type safety

------------------------------------------------------------------------

# Background Processing

## Celery + Redis

### Purpose

-   OCR
-   Video analysis
-   AI inference
-   Report generation
-   Long-running jobs

------------------------------------------------------------------------

# AI Workflow

## LangGraph

### Purpose

-   Evidence processing pipeline
-   OCR
-   Metadata extraction
-   Risk assessment
-   Timeline reconstruction
-   Report generation

------------------------------------------------------------------------

# Authentication

## Clerk

### Features

-   Multi-factor authentication
-   Passkeys
-   OAuth
-   RBAC
-   Organizations

### Alternative

-   Auth.js (self-hosted deployments)

------------------------------------------------------------------------

# Databases

## PostgreSQL

Stores: - Users - Cases - Evidence metadata - Reports - Permissions -
Audit logs

### Why

-   ACID compliance
-   JSON support
-   Reliable relational storage

------------------------------------------------------------------------

## Neo4j

Purpose: - Relationship graphs - Network intelligence - Suspect
connection mapping

### Why

Graph databases naturally represent entities and relationships better
than relational joins.

------------------------------------------------------------------------

## Vector Database

### Qdrant

Purpose: - Semantic search - Evidence similarity - Retrieval-Augmented
Generation (RAG)

Alternative: - pgvector

------------------------------------------------------------------------

# Cache

## Redis

Used for: - Sessions - Queues - Rate limiting - Temporary AI results

------------------------------------------------------------------------

# Object Storage

Recommended: - AWS S3 - Cloudflare R2 - MinIO (self-hosted)

Why: Large multimedia evidence should be stored in object storage
instead of relational databases.

------------------------------------------------------------------------

# Search Engine

## OpenSearch

Supports: - OCR text search - Metadata search - Investigator keyword
search - Large-scale indexing

------------------------------------------------------------------------

# AI Models & Processing

## OCR

-   PaddleOCR

## Metadata Extraction

-   ExifTool

## Video Processing

-   FFmpeg

## PDF Processing

-   PyMuPDF

## Speech Recognition

-   OpenAI Whisper

## Vision Models

-   Florence-2
-   Gemma Vision

## Deepfake Detection

Use an ensemble of specialized image, audio, and video detection models.

## Large Language Model

Primary: - GPT-5.5 API

Secondary: - Llama 4 (local deployments)

## Embeddings

-   OpenAI Embeddings
-   Nomic Embeddings

------------------------------------------------------------------------

# Deployment

## Frontend

-   Vercel

## Backend

-   Railway (MVP)
-   Kubernetes (Production)

## Containerization

-   Docker

## Orchestration

-   Kubernetes

------------------------------------------------------------------------

# CI/CD

## GitHub Actions

Automates: - Testing - Linting - Security scanning - Deployment

------------------------------------------------------------------------

# Monitoring

-   Grafana
-   Prometheus
-   OpenTelemetry
-   Sentry

------------------------------------------------------------------------

# Logging

## Loki

Used for structured application and evidence-processing logs.

------------------------------------------------------------------------

# Security

-   TLS 1.3
-   AES-256 encryption at rest
-   Signed URLs
-   RBAC
-   MFA
-   Immutable audit logs
-   Evidence hash verification

------------------------------------------------------------------------

# Suggested Repository Structure

``` text
frontend/
backend/
workers/
ai/
gateway/
docs/
infra/
docker/
```

------------------------------------------------------------------------

# Technology Summary

  ----------------------------------------------------------------------------
  Layer            Recommended Technology               Justification
  ---------------- ------------------------------------ ----------------------
  Frontend         Next.js + React                      Modern, performant
                                                        dashboards

  Styling          Tailwind CSS + shadcn/ui             Fast, consistent UI
                                                        development

  Authentication   Clerk                                Enterprise-grade
                                                        authentication with
                                                        MFA and RBAC

  Backend          FastAPI                              Best ecosystem for
                                                        AI-powered
                                                        applications

  Primary Database PostgreSQL                           Reliable relational
                                                        data storage

  Graph Database   Neo4j                                Efficient relationship
                                                        and network analysis

  Vector Database  Qdrant                               Semantic search and
                                                        RAG

  Cache            Redis                                Fast caching and
                                                        background job support

  Search           OpenSearch                           Powerful indexing and
                                                        evidence search

  Object Storage   S3 / R2 / MinIO                      Scalable multimedia
                                                        storage

  AI Workflow      LangGraph                            Structured,
                                                        explainable AI
                                                        pipelines

  OCR              PaddleOCR                            Accurate multilingual
                                                        text extraction

  Metadata         ExifTool                             Industry-standard
                                                        metadata extraction

  Speech           Whisper                              High-quality
                                                        transcription

  Vision           Florence-2 / Gemma Vision            Image understanding

  Deployment       Docker + Kubernetes                  Portable and scalable
                                                        infrastructure

  Monitoring       Grafana + Prometheus + Sentry        Observability and
                                                        reliability
  ----------------------------------------------------------------------------

------------------------------------------------------------------------

# Conclusion

This stack provides a secure, scalable, AI-native foundation for
Sentinel Fusion. By combining **FastAPI**, **Next.js**, **PostgreSQL**,
**Neo4j**, **Qdrant**, and **LangGraph**, the platform can efficiently
transform fragmented digital evidence into explainable, actionable
intelligence while maintaining enterprise-grade security and human
oversight.
