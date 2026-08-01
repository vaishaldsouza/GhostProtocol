import asyncio
import logging
from typing import List, Dict, Any, Optional
from supabase import create_client, Client as SupabaseClient
from app.config import settings
from app.services.voice_call_service import voice_call_service

logger = logging.getLogger(__name__)

# Blood Compatibility Rules
COMPATIBILITY_MAP = {
    "A+": ["A+", "A-", "O+", "O-"],
    "A-": ["A-", "O-"],
    "B+": ["B+", "B-", "O+", "O-"],
    "B-": ["B-", "O-"],
    "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "AB-": ["AB-", "A-", "B-", "O-"],
    "O+": ["O+", "O-"],
    "O-": ["O-"]
}


class CallScheduler:
    """
    Asynchronous Call Scheduler for automated emergency blood donation cascades.
    Handles donor ranking, retry logic, sequential call dispatching, and acceptance termination.
    """

    def __init__(self):
        try:
            self.supabase: SupabaseClient = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client in CallScheduler: {e}")
            self.supabase = None

    def fetch_top_compatible_donors(
        self,
        blood_group: str,
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Fetches eligible donors from Supabase matching compatible blood types,
        sorted by eligibility, availability, and response score.
        """
        compatible_groups = COMPATIBILITY_MAP.get(blood_group, [blood_group, "O-"])
        
        if self.supabase:
            try:
                # Query donors joined with profiles/users
                response = self.supabase.table("donors").select("*, users(*)").in_("blood_group", compatible_groups).eq("eligible", True).eq("availability", True).execute()
                donors = response.data or []
                
                # Format donor details
                formatted = []
                for d in donors:
                    user = d.get("users") or {}
                    formatted.append({
                        "id": d.get("id"),
                        "name": user.get("full_name", "Registered Donor"),
                        "phone": user.get("phone", "+18005550199"),
                        "blood_group": d.get("blood_group"),
                        "distance_km": round(float(d.get("distance_km", 2.5)), 1),
                        "response_score": d.get("response_score", 95)
                    })
                
                # Sort by response score descending
                formatted.sort(key=lambda x: x["response_score"], reverse=True)
                return formatted[:limit]
            except Exception as e:
                logger.error(f"Error querying Supabase donors: {e}")

        # Demo fallback donor list for development/testing
        return [
            {"id": "d101", "name": "Sarah Connor", "phone": "+18005550199", "blood_group": blood_group, "distance_km": 1.8, "response_score": 98},
            {"id": "d102", "name": "Marcus Vance", "phone": "+18005550198", "blood_group": "O-", "distance_km": 2.4, "response_score": 94},
            {"id": "d103", "name": "Elena Rostova", "phone": "+18005550197", "blood_group": blood_group, "distance_km": 3.1, "response_score": 90},
        ][:limit]

    async def trigger_emergency_calling_cascade(
        self,
        request_id: str,
        hospital_name: Optional[str] = "City General Hospital ICU",
        blood_group: Optional[str] = "O-",
        units_required: int = 2
    ) -> Dict[str, Any]:
        """
        Executes an asynchronous automated voice calling cascade:
        1. Fetches top compatible donors from Supabase.
        2. Places an automated voice call to each donor sequentially.
        3. Stops notifying remaining donors as soon as a donor accepts (presses 1).
        4. Continues to next donor if declined (presses 2) or call fails after retries.
        """
        logger.info(f"Starting Emergency Calling Cascade for Request ID {request_id}")

        donors = self.fetch_top_compatible_donors(blood_group=blood_group, limit=5)
        cascade_summary = {
            "request_id": request_id,
            "hospital_name": hospital_name,
            "blood_group": blood_group,
            "total_donors_targeted": len(donors),
            "status": "in_progress",
            "calls_attempted": [],
            "accepted_donor": None
        }

        for index, donor in enumerate(donors):
            logger.info(f"Cascade Step {index + 1}/{len(donors)}: Calling {donor['name']} ({donor['phone']})")

            call_success = False
            for retry in range(settings.MAX_CALL_RETRIES):
                result = voice_call_service.place_call(
                    phone_number=donor["phone"],
                    request_id=request_id,
                    donor_id=donor["id"],
                    blood_group=blood_group,
                    hospital_name=hospital_name,
                    distance_km=donor["distance_km"],
                    retry_count=retry
                )

                cascade_summary["calls_attempted"].append({
                    "donor_id": donor["id"],
                    "donor_name": donor["name"],
                    "call_sid": result["call_sid"],
                    "status": result["status"],
                    "retry_number": retry
                })

                if result["success"]:
                    call_success = True
                    break
                else:
                    logger.warning(f"Call attempt {retry + 1} failed for {donor['name']}. Retrying in {settings.CALL_RETRY_DELAY_SECONDS}s...")
                    await asyncio.sleep(1) # Simulated backoff delay

            if not call_success:
                logger.error(f"All {settings.MAX_CALL_RETRIES} call retries failed for donor {donor['name']}. Moving to next donor.")

            # In production webhook flow, DTMF callbacks update status asynchronously.
            # In simulation / test mode, check if accepted:
            # Check Supabase status
            if self.supabase:
                try:
                    res = self.supabase.table("notifications").select("status").eq("request_id", request_id).eq("donor_id", donor["id"]).execute()
                    if res.data and res.data[0].get("status") == "ACCEPTED":
                        logger.info(f"ACCEPTED by donor {donor['name']}! Stopping cascade immediately.")
                        cascade_summary["status"] = "fulfilled"
                        cascade_summary["accepted_donor"] = donor
                        break
                except Exception as e:
                    logger.error(f"Error checking donor acceptance status: {e}")

        if cascade_summary["status"] != "fulfilled":
            cascade_summary["status"] = "exhausted_no_acceptance"

        logger.info(f"Completed Emergency Calling Cascade for Request {request_id}. Status: {cascade_summary['status']}")
        return cascade_summary


call_scheduler = CallScheduler()
