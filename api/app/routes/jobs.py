from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import uuid4

router = APIRouter(prefix="/jobs", tags=["jobs"])

# ---- Models ----
class Customer(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None

class Site(BaseModel):
    address: Optional[str] = None
    notes: Optional[str] = None

class JobCreate(BaseModel):
    customer: Customer
    site: Optional[Site] = None

class Job(BaseModel):
    jobId: str
    createdAt: datetime
    updatedAt: datetime
    status: str = Field(default="lead")
    customer: Customer
    site: Optional[Site] = None

# ---- In-memory store ----
_JOBS: dict[str, Job] = {}

@router.get("", response_model=List[Job])
def list_jobs():
    return list(_JOBS.values())

@router.post("", response_model=Job)
def create_job(payload: JobCreate):
    now = datetime.utcnow()
    job = Job(
        jobId=str(uuid4()),
        createdAt=now,
        updatedAt=now,
        status="lead",
        customer=payload.customer,
        site=payload.site,
    )
    _JOBS[job.jobId] = job
    return job

@router.get("/{job_id}", response_model=Job)
def get_job(job_id: str):
    job = _JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

