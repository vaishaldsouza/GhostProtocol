from typing import Optional, List
from pydantic import BaseModel, Field

class DonorBase(BaseModel):
    id: str
    name: str
    blood_group: str
    phone: str
    email: Optional[str] = None
    latitude: float
    longitude: float
    location: str
    is_available: bool = True
    is_active: bool = True
    is_verified: bool = True
    age: int = 28
    last_donated_days_ago: int = 90
    total_requests_received: int = 10
    accepted_requests: int = 8
    declined_requests: int = 2
    total_donations: int = 5
    availability_status: str = "available"  # "available", "busy", "unavailable"


class ScoreBreakdown(BaseModel):
    distance_km: float
    distance_score: float = Field(..., ge=0, le=100)
    eligibility_score: float = Field(..., ge=0, le=100)
    acceptance_rate_score: float = Field(..., ge=0, le=100)
    availability_score: float = Field(..., ge=0, le=100)
    blood_match_score: float = Field(..., ge=0, le=100)
    final_score: float = Field(..., ge=0, le=100)
    acceptance_probability: float = Field(..., ge=0, le=1)
    compatibility_reason: str
    rank: int = 1


class RankedDonor(DonorBase):
    score_breakdown: ScoreBreakdown
    status: str = "eligible"  # "eligible", "notified", "accepted", "declined", "reserved"
    estimated_eta_minutes: int = 15
