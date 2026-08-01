import logging
from typing import Dict, Any, Tuple
from twilio.twiml.voice_response import VoiceResponse, Gather
from supabase import create_client, Client as SupabaseClient
from app.config import settings
from app.services.voice_call_service import voice_call_service

logger = logging.getLogger(__name__)


class IVRHandler:
    """
    Handles Twilio Interactive Voice Response (IVR) generation and DTMF keypad input processing.
    """

    def __init__(self):
        try:
            self.supabase: SupabaseClient = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client in IVRHandler: {e}")
            self.supabase = None

    def generate_initial_twiml(
        self,
        blood_group: str,
        hospital: str,
        distance_km: float,
        request_id: str,
        donor_id: str
    ) -> str:
        """
        Generates production TwiML XML with <Gather> for capturing DTMF keypad press (1 or 2).
        
        Exact message format requested:
        "Hello.
        This is an emergency alert from RedPulse AI.
        A nearby hospital urgently requires {Blood Group} blood.
        Hospital Name: {Hospital}
        Distance: {Distance} kilometers.
        If you are available to donate, press 1.
        If you are unavailable, press 2.
        Thank you for helping save lives."
        """
        response = VoiceResponse()

        # Construct gather URL for DTMF response callback
        gather_action = (
            f"{settings.TWILIO_WEBHOOK_URL}/gather"
            f"?request_id={request_id}&donor_id={donor_id}"
        )

        gather = Gather(
            num_digits=1,
            action=gather_action,
            method="POST",
            timeout=settings.IVR_GATHER_TIMEOUT
        )

        message_text = (
            f"Hello. "
            f"This is an emergency alert from RedPulse AI. "
            f"A nearby hospital urgently requires {blood_group} blood. "
            f"Hospital Name: {hospital}. "
            f"Distance: {distance_km} kilometers. "
            f"If you are available to donate, press 1. "
            f"If you are unavailable, press 2. "
            f"Thank you for helping save lives."
        )

        gather.say(message_text, voice="Polly.Joanna", language="en-US")
        response.append(gather)

        # Fallback if no keypad entry received before timeout
        response.say("We did not receive any response. We will try reaching you again later. Goodbye.", voice="Polly.Joanna")
        response.hangup()

        return str(response)

    def process_dtmf_response(
        self,
        digits: str,
        request_id: str,
        donor_id: str,
        call_sid: str
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Processes DTMF keypad response (1 = ACCEPTED, 2 = DECLINED).
        Updates donor status in Supabase, stops/continues calling cascade,
        updates hospital dashboard real-time, and logs call status.
        """
        response = VoiceResponse()
        result_metadata: Dict[str, Any] = {
            "digits": digits,
            "request_id": request_id,
            "donor_id": donor_id,
            "call_sid": call_sid,
            "action": "unknown"
        }

        logger.info(f"Processing DTMF '{digits}' for call {call_sid}, donor {donor_id}, request {request_id}")

        if digits == "1":
            # Donor ACCEPTED emergency blood request
            result_metadata["action"] = "ACCEPTED"
            response.say(
                "Thank you for accepting! You have been registered as an ACCEPTED donor. "
                "The hospital has been notified and will send dispatch details shortly. Goodbye.",
                voice="Polly.Joanna"
            )

            # 1. Update donor notification status in Supabase
            if self.supabase:
                try:
                    self.supabase.table("notifications").upsert({
                        "request_id": request_id,
                        "donor_id": donor_id,
                        "status": "ACCEPTED"
                    }).execute()

                    # 2. Update emergency request status to FULFILLED or MATCHED
                    self.supabase.table("emergency_requests").update({
                        "status": "fulfilled",
                        "notes": f"Accepted by donor {donor_id} via Twilio Voice Call"
                    }).eq("id", request_id).execute()

                    logger.info(f"Supabase updated: Request {request_id} marked as ACCEPTED by donor {donor_id}")
                except Exception as e:
                    logger.error(f"Failed updating Supabase on acceptance: {e}")

            # 3. Log acceptance in call_logs table
            voice_call_service.update_call_status(
                call_sid=call_sid,
                status="completed",
                dtmf_response="1"
            )

        elif digits == "2":
            # Donor DECLINED emergency blood request
            result_metadata["action"] = "DECLINED"
            response.say(
                "Thank you for letting us know. We have recorded your response and will contact the next available donor. Goodbye.",
                voice="Polly.Joanna"
            )

            # Update donor notification status
            if self.supabase:
                try:
                    self.supabase.table("notifications").upsert({
                        "request_id": request_id,
                        "donor_id": donor_id,
                        "status": "DECLINED"
                    }).execute()
                except Exception as e:
                    logger.error(f"Failed updating Supabase on decline: {e}")

            # Log decline in call_logs table
            voice_call_service.update_call_status(
                call_sid=call_sid,
                status="completed",
                dtmf_response="2"
            )

            # Signal call scheduler to progress to the next eligible donor
            result_metadata["trigger_next_donor"] = True

        else:
            # Invalid input
            result_metadata["action"] = "INVALID_KEY"
            response.say(
                "Invalid selection. Please press 1 if you are available to donate, or press 2 if unavailable.",
                voice="Polly.Joanna"
            )
            
            # Re-gather
            gather_action = (
                f"{settings.TWILIO_WEBHOOK_URL}/gather"
                f"?request_id={request_id}&donor_id={donor_id}"
            )
            gather = Gather(num_digits=1, action=gather_action, method="POST", timeout=10)
            response.append(gather)

        return str(response), result_metadata


ivr_handler = IVRHandler()
