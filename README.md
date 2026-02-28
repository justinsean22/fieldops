# FieldOps

Mobile-first field operations platform for contractors and trade professionals.

FieldOps is designed to solve real on-site problems with minimal interaction time.
The system prioritizes fast capture, documentation, and job lifecycle support using voice-first and tap-first workflows.

---

## Current Status (V1 Foundation)

This repository contains the initialized architecture for:

* Job creation
* API connectivity
* Shared data models
* Mobile-first web interface (PWA-ready)
* FastAPI backend

A working vertical slice is complete:

Frontend → API → Job creation → UI display

---

## Architecture Overview

FieldOps uses a modular architecture that separates:

| Layer    | Purpose                     |
| -------- | --------------------------- |
| Frontend | Mobile-first PWA            |
| Backend  | Business logic + processing |
| Shared   | Typed schemas               |
| Infra    | Future deployment config    |

```
fieldops/
  api/        → FastAPI service
  web/        → React PWA
  shared/     → Cross-layer types
  infra/      → Deployment (future)
```

---

## Technology Stack

### Frontend

* React (Vite)
* Progressive Web App capable
* TypeScript-compatible
* Tap-first UX

### Backend

* FastAPI
* In-memory store (temporary)
* REST architecture

### Shared

* Typed domain models for:

  * Job
  * Agreement
  * Invoice

### Runtime

* Local development environment
* Designed for Cloud Run deployment

---

## Features Implemented

### Job Management (Initial)

* Create new jobs
* View job list
* Status initialized as `lead`

### API Health Monitoring

Frontend verifies backend connectivity via:

```
GET /health
```

### Jobs API (In-Memory)

```
GET  /jobs
POST /jobs
GET  /jobs/{jobId}
```

Jobs persist during runtime for development testing.

---

## Data Model (Current)

### Job

```ts
{
  jobId: string
  createdAt: ISODate
  updatedAt: ISODate
  status: "lead"
  customer: {
    name: string
    phone?: string
    email?: string
  }
  site?: {
    address?: string
    notes?: string
  }
}
```

---

## Local Development Setup

### 1. Backend

```bash
cd api
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:

```bash
curl http://localhost:8000/health
```

---

### 2. Frontend

```bash
cd web
npm run dev
```

App runs at:

```
http://localhost:5173
```

---

### 3. Environment Variables

#### Backend

```
api/.env
```

#### Frontend

```
web/.env
VITE_API_BASE_URL=http://localhost:8000
```

---

## API Connectivity Flow

```
Browser (5173)
    ↓
FastAPI (8000)
    ↓
In-Memory Store
```

CORS enabled for local development.

---

## Current UX

The system currently supports:

* API connectivity verification
* One-tap job creation
* Real-time list updates

Designed to simulate:

Field-ready job intake in <15 seconds

---

## Project Philosophy

FieldOps is not designed to replace enterprise platforms.

It is built to:

* Capture real-world agreements
* Reduce documentation risk
* Enable fast field workflows

Primary design constraint:

> Useable with one thumb while standing on-site.

---

## Upcoming V1 Targets

Planned next modules:

* Agreement Capture
* Invoice Generation
* Receipt OCR → Personal PriceBook
* Evidence PDF generation

---

## Deployment Path (Planned)

Future hosting structure:

| Component | Target           |
| --------- | ---------------- |
| Frontend  | Firebase Hosting |
| Backend   | Google Cloud Run |
| Data      | Firestore        |
| Storage   | Cloud Storage    |

---

## License

Pending

---

## Maintainer

Project initiated by Justin Fitts
Designed for real-world contractor workflows.

---

When you're ready later, request:

"Generate updated README"

to reflect new architecture and features.
