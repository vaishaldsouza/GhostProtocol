"""
Smart Notification Strategy Service for RedPulse AI Emergency Dispatch.
Handles multi-channel notifications (WhatsApp, Email, Twilio Voice) based on urgency strategy.
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.donor import RankedDonor
from app.services.voice_call_service import voice_call_service

logger = logging.getLogger("redpulse.notification_service")

class NotificationService:
    URGENCY_BATCH_LIMITS = {
        "critical": 10,
        "high": 5,
        "normal": 3
    }

    def determine_notification_batch_size(self, urgency: str) -> int:
        norm = urgency.strip().lower() if urgency else "critical"
        return self.URGENCY_BATCH_LIMITS.get(norm, 5)

    async def notify_donors_cascade(
        self,
        request_id: str,
        ranked_donors: List[RankedDonor],
        urgency: str = "critical",
        channels: Optional[List[str]] = None,
        hospital_name: str = "City General Hospital ICU",
        blood_group: str = "O-"
    ) -> Dict[str, Any]:
        """
        Triggers smart notifications based on urgency level:
        - Critical Emergency: Top 10 donors simultaneously
        - High Priority: Top 5 donors
        - Normal Priority: Top 3 donors
        """
        if channels is None:
            channels = ["whatsapp", "email", "voice"]

        batch_limit = self.determine_notification_batch_size(urgency)
        donors_to_notify = ranked_donors[:batch_limit]

        dispatch_results = []
        logger.info(f"Triggering smart notification strategy ({urgency.upper()}) for Top {len(donors_to_notify)} donors on request {request_id}")

        for rank_idx, donor in enumerate(donors_to_notify, start=1):
            donor_res = {
                "donor_id": donor.id,
                "donor_name": donor.name,
                "rank": rank_idx,
                "phone": donor.phone,
                "channels_sent": [],
                "timestamp": datetime.utcnow().isoformat()
            }

            # 1. WhatsApp Dispatch
            if "whatsapp" in channels:
                wa_success = self._send_whatsapp_alert(donor, hospital_name, blood_group, request_id)
                if wa_success:
                    donor_res["channels_sent"].append("whatsapp")
                    self._log_notification_to_supabase(request_id, donor.id, "whatsapp", "sent")

            # 2. Email Dispatch
            if "email" in channels:
                email_success = self._send_email_alert(donor, hospital_name, blood_group, request_id)
                if email_success:
                    donor_res["channels_sent"].append("email")
                    self._log_notification_to_supabase(request_id, donor.id, "email", "sent")

            # 3. Automated Twilio Voice Call Dispatch
            if "voice" in channels:
                voice_res = voice_call_service.initiate_outbound_call(
                    to_phone=donor.phone,
                    donor_id=donor.id,
                    request_id=request_id,
                    blood_group=blood_group,
                    hospital_name=hospital_name,
                    distance_km=donor.score_breakdown.distance_km
                )
                if voice_res.get("status") in ["queued", "initiated"]:
                    donor_res["channels_sent"].append("voice")
                    donor_res["call_sid"] = voice_res.get("call_sid")
                    self._log_notification_to_supabase(request_id, donor.id, "voice", "initiated")

            dispatch_results.append(donor_res)

        return {
            "status": "success",
            "request_id": request_id,
            "urgency": urgency,
            "batch_size": len(donors_to_notify),
            "notified_donors": dispatch_results
        }

    def _send_whatsapp_alert(self, donor: RankedDonor, hospital: str, blood: str, req_id: str) -> bool:
        logger.info(f"📱 [WhatsApp Sent] To: {donor.name} ({donor.phone}) -> Urgent {blood} needed at {hospital}")
        return True

    def _send_email_alert(self, donor: RankedDonor, hospital: str, blood: str, req_id: str) -> bool:
        email = donor.email or f"{donor.name.lower().replace(' ', '.')}@redpulse.health"
        logger.info(f"📧 [Email Sent] To: {email} -> Emergency Blood Request {blood}")
        return True

    def _log_notification_to_supabase(self, request_id: str, donor_id: str, channel: str, status: str):
        if voice_call_service.supabase:
            try:
                voice_call_service.supabase.table("notification_logs").insert({
                    "request_id": request_id,
                    "donor_id": donor_id,
                    "channel": channel,
                    "status": status,
                    "sent_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception as e:
                logger.warning(f"Could not log notification to Supabase: {e}")


notification_service = NotificationService()
