"""
Prediction Service for RedPulse AI Emergency Blood Donation Platform.
Orchestrates donor eligibility filtering, scoring, ranking, database updates, and response handling.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from app.models.donor import DonorBase, RankedDonor, ScoreBreakdown
from app.models.blood_request import PredictDonorsRequest
from app.services.scoring_engine import scoring_engine
from app.services.notification_service import notification_service
from app.services.voice_call_service import voice_call_service

logger = logging.getLogger("redpulse.prediction_service")

# Seeded fallback donors for testing or offline mode
SEED_DONORS: List[DonorBase] = [
    DonorBase(
        id="d1",
        name="Sarah Jenkins",
        blood_group="O-",
        phone="+15550192831",
        email="sarah.j@redpulse.health",
        latitude=12.9720,
        longitude=77.5950,
        location="Indiranagar (1.2 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=29,
        last_donated_days_ago=110,
        total_requests_received=12,
        accepted_requests=11,
        declined_requests=1,
        total_donations=8,
        availability_status="available"
    ),
    DonorBase(
        id="d2",
        name="Michael Chen",
        blood_group="O-",
        phone="+15550183722",
        email="m.chen@redpulse.health",
        latitude=12.9780,
        longitude=77.6010,
        location="Koramangala (2.8 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=34,
        last_donated_days_ago=95,
        total_requests_received=15,
        accepted_requests=13,
        declined_requests=2,
        total_donations=10,
        availability_status="available"
    ),
    DonorBase(
        id="d3",
        name="Elena Rostova",
        blood_group="O+",
        phone="+15550174833",
        email="elena.r@redpulse.health",
        latitude=12.9650,
        longitude=77.5890,
        location="MG Road (3.4 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=26,
        last_donated_days_ago=120,
        total_requests_received=8,
        accepted_requests=7,
        declined_requests=1,
        total_donations=5,
        availability_status="available"
    ),
    DonorBase(
        id="d4",
        name="David Miller",
        blood_group="A-",
        phone="+15550165944",
        email="david.m@redpulse.health",
        latitude=12.9850,
        longitude=77.6120,
        location="Jayanagar (4.5 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=41,
        last_donated_days_ago=140,
        total_requests_received=20,
        accepted_requests=16,
        declined_requests=4,
        total_donations=12,
        availability_status="available"
    ),
    DonorBase(
        id="d5",
        name="Priya Sharma",
        blood_group="O-",
        phone="+15550156055",
        email="priya.s@redpulse.health",
        latitude=12.9910,
        longitude=77.6250,
        location="Whitefield (6.1 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=31,
        last_donated_days_ago=75,
        total_requests_received=10,
        accepted_requests=8,
        declined_requests=2,
        total_donations=6,
        availability_status="available"
    ),
    DonorBase(
        id="d6",
        name="Robert Taylor",
        blood_group="B-",
        phone="+15550147166",
        email="robert.t@redpulse.health",
        latitude=12.9550,
        longitude=77.5750,
        location="HSR Layout (7.2 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=38,
        last_donated_days_ago=100,
        total_requests_received=14,
        accepted_requests=10,
        declined_requests=4,
        total_donations=7,
        availability_status="available"
    ),
    DonorBase(
        id="d7",
        name="Anita Patel",
        blood_group="A+",
        phone="+15550138277",
        email="anita.p@redpulse.health",
        latitude=12.9400,
        longitude=77.5600,
        location="Electronic City (12.0 km away)",
        is_available=True,
        is_active=True,
        is_verified=True,
        age=24,
        last_donated_days_ago=65,
        total_requests_received=6,
        accepted_requests=5,
        declined_requests=1,
        total_donations=3,
        availability_status="available"
    )
]

class PredictionService:
    def __init__(self):
        # In-memory prediction cache for fast responses & fallback: request_id -> List[RankedDonor]
        self._predictions_cache: Dict[str, List[RankedDonor]] = {}
        # Tracks active donor statuses per request: (request_id, donor_id) -> status
        self._donor_statuses: Dict[str, str] = {}

    def fetch_donors(self) -> List[DonorBase]:
        """Fetches active donors from Supabase or returns seed list."""
        if voice_call_service.supabase:
            try:
                res = voice_call_service.supabase.table("donors").select("*").execute()
                if res.data and len(res.data) > 0:
                    donors = []
                    for row in res.data:
                        donors.append(DonorBase(
                            id=row.get("id", str(uuid.uuid4())),
                            name=row.get("name", "Unknown Donor"),
                            blood_group=row.get("blood_group", "O-"),
                            phone=row.get("phone", "+15550000000"),
                            email=row.get("email"),
                            latitude=float(row.get("latitude", 12.9716)),
                            longitude=float(row.get("longitude", 77.5946)),
                            location=row.get("location", "City Area"),
                            is_available=bool(row.get("is_available", True)),
                            is_active=bool(row.get("is_active", True)),
                            is_verified=bool(row.get("is_verified", True)),
                            age=int(row.get("age", 28)),
                            last_donated_days_ago=int(row.get("last_donated_days_ago", 90)),
                            total_requests_received=int(row.get("total_requests_received", 10)),
                            accepted_requests=int(row.get("accepted_requests", 8)),
                            declined_requests=int(row.get("declined_requests", 2)),
                            total_donations=int(row.get("total_donations", 5)),
                            availability_status=row.get("availability_status", "available")
                        ))
                    return donors
            except Exception as e:
                logger.warning(f"Failed to fetch donors from Supabase: {e}")

        return SEED_DONORS

    def predict_and_rank_donors(self, req: PredictDonorsRequest) -> List[RankedDonor]:
        """
        Executes blood compatibility filtering, eligibility checks, distance scoring,
        and weighted ranking formula for a blood request.
        """
        donors = self.fetch_donors()
        ranked_list: List[RankedDonor] = []

        for donor in donors:
            score_breakdown, is_eligible = scoring_engine.calculate_score(
                donor=donor,
                hospital_lat=req.hospital_latitude,
                hospital_lon=req.hospital_longitude,
                required_blood=req.blood_group
            )

            if is_eligible and score_breakdown.distance_km <= req.max_distance_km:
                # Estimate travel ETA
                eta_mins = max(5, int(5 + score_breakdown.distance_km * 2.5))
                status_key = f"{req.request_id}:{donor.id}"
                current_status = self._donor_statuses.get(status_key, "eligible")

                ranked_donor = RankedDonor(
                    **donor.dict(),
                    score_breakdown=score_breakdown,
                    status=current_status,
                    estimated_eta_minutes=eta_mins
                )
                ranked_list.append(ranked_donor)

        # Sort donors by score in descending order
        ranked_list.sort(key=lambda d: d.score_breakdown.final_score, reverse=True)

        # Assign rankings 1..N
        for idx, item in enumerate(ranked_list, start=1):
            item.score_breakdown.rank = idx

        # Cache predictions
        self._predictions_cache[req.request_id] = ranked_list

        # Log predictions to Supabase
        self._log_predictions_to_supabase(req.request_id, ranked_list)

        return ranked_list

    def _log_predictions_to_supabase(self, request_id: str, ranked_donors: List[RankedDonor]):
        if voice_call_service.supabase:
            try:
                records = []
                now_str = datetime.utcnow().isoformat()
                for donor in ranked_donors:
                    records.append({
                        "request_id": request_id,
                        "donor_id": donor.id,
                        "prediction_score": donor.score_breakdown.final_score,
                        "distance_km": donor.score_breakdown.distance_km,
                        "blood_compatibility": donor.score_breakdown.compatibility_reason,
                        "acceptance_probability": donor.score_breakdown.acceptance_probability,
                        "created_at": now_str
                    })
                if records:
                    voice_call_service.supabase.table("prediction_logs").insert(records).execute()
            except Exception as e:
                logger.warning(f"Could not insert prediction_logs to Supabase: {e}")

    async def accept_donation(self, request_id: str, donor_id: str, channel: str = "web") -> Dict[str, Any]:
        """
        Handles donor acceptance:
        - Updates status = ACCEPTED
        - Reserves donor
        - Broadcasts real-time update to hospital dashboard
        """
        key = f"{request_id}:{donor_id}"
        self._donor_statuses[key] = "accepted"

        # Update Supabase blood_requests and donor_history
        if voice_call_service.supabase:
            try:
                voice_call_service.supabase.table("donor_history").insert({
                    "request_id": request_id,
                    "donor_id": donor_id,
                    "response_status": "ACCEPTED",
                    "channel": channel,
                    "responded_at": datetime.utcnow().isoformat()
                }).execute()

                voice_call_service.supabase.table("blood_requests").update({
                    "donation_status": "ACCEPTED",
                    "accepted_donor_id": donor_id,
                    "updated_at": datetime.utcnow().isoformat()
                }).eq("id", request_id).execute()
            except Exception as e:
                logger.warning(f"Could not update Supabase on accept: {e}")

        logger.info(f"✅ Donor {donor_id} ACCEPTED request {request_id} via {channel}")

        return {
            "status": "success",
            "message": f"Donor {donor_id} accepted request {request_id}. Reserved for dispatch.",
            "request_id": request_id,
            "donor_id": donor_id,
            "donation_status": "ACCEPTED"
        }

    async def decline_donation(self, request_id: str, donor_id: str, reason: Optional[str] = None, channel: str = "web") -> Dict[str, Any]:
        """
        Handles donor decline:
        - Updates status = DECLINED
        - Automatically triggers cascade notification to next ranked donor
        """
        key = f"{request_id}:{donor_id}"
        self._donor_statuses[key] = "declined"

        if voice_call_service.supabase:
            try:
                voice_call_service.supabase.table("donor_history").insert({
                    "request_id": request_id,
                    "donor_id": donor_id,
                    "response_status": "DECLINED",
                    "decline_reason": reason or "Unavailable",
                    "channel": channel,
                    "responded_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception as e:
                logger.warning(f"Could not update Supabase on decline: {e}")

        logger.info(f"❌ Donor {donor_id} DECLINED request {request_id} ({reason or 'No reason'})")

        # Find next eligible donor in cached predictions to notify automatically
        cached_list = self._predictions_cache.get(request_id, [])
        next_donor = None
        for d in cached_list:
            d_key = f"{request_id}:{d.id}"
            if self._donor_statuses.get(d_key, "eligible") == "eligible" and d.id != donor_id:
                next_donor = d
                break

        next_notification_res = None
        if next_donor:
            next_notification_res = await notification_service.notify_donors_cascade(
                request_id=request_id,
                ranked_donors=[next_donor],
                urgency="critical",
                channels=["whatsapp", "voice"]
            )

        return {
            "status": "success",
            "message": f"Donor {donor_id} declined. Auto-cascade triggered for next top donor.",
            "request_id": request_id,
            "donor_id": donor_id,
            "donation_status": "DECLINED",
            "next_notified_donor": next_donor.name if next_donor else "None available",
            "next_notification_details": next_notification_res
        }

    def get_prediction_history(self, request_id: str) -> Dict[str, Any]:
        """Fetches prediction logs for a given request_id."""
        if voice_call_service.supabase:
            try:
                res = voice_call_service.supabase.table("prediction_logs").select("*").eq("request_id", request_id).execute()
                if res.data:
                    return {"request_id": request_id, "logs": res.data}
            except Exception as e:
                logger.warning(f"Could not fetch prediction history from Supabase: {e}")

        cached = self._predictions_cache.get(request_id, [])
        logs = []
        for d in cached:
            logs.append({
                "request_id": request_id,
                "donor_id": d.id,
                "donor_name": d.name,
                "prediction_score": d.score_breakdown.final_score,
                "distance_km": d.score_breakdown.distance_km,
                "blood_compatibility": d.score_breakdown.compatibility_reason,
                "acceptance_probability": d.score_breakdown.acceptance_probability,
                "created_at": datetime.utcnow().isoformat()
            })

        return {"request_id": request_id, "logs": logs}


prediction_service = PredictionService()
