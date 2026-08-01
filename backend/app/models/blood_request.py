from typing import Optional, List
from pydantic import BaseModel, Field

class BloodRequest(BaseModel):
    request_id: str
    hospital_name: str
    hospital_latitude: float
    hospital_longitude: float
    hospital_location: str = "City Center Emergency Ward"
    blood_group: str
    units_needed: int = 2
    urgency: str = "critical"  # "critical", "high", "normal"
    status: str = "active"     # "active", "fulfilled", "cancelled"
    created_at: Optional[str] = None


class PredictDonorsRequest(BaseModel):
    request_id: str
    hospital_name: str = "City General Hospital ICU"
    hospital_latitude: float = 12.9716
    hospital_longitude: float = 77.5946
    blood_group: str = "O-"
    units_needed: int = 2
    urgency: str = "critical"  # "critical", "high", "normal"
    max_distance_km: float = 50.0


class NotifyDonorsRequest(BaseModel):
    request_id: str
    donor_ids: Optional[List[str]] = None
    channels: List[str] = ["whatsapp", "email", "voice"]
    urgency: str = "critical"


class DonorResponseRequest(BaseModel):
    request_id: str
    donor_id: str
    reason: Optional[str] = None
    channel: str = "web"


class NotificationLogEntry(BaseModel):
    id: str
    request_id: str
    donor_id: str
    channel: str
    status: str
    sent_at: str
    message: Optional[str] = None


class PredictionLogEntry(BaseModel):
    id: str
    request_id: str
    donor_id: str
    prediction_score: float
    distance_km: float
    blood_compatibility: str
    acceptance_probability: float
    created_at: str
