import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException
from supabase import create_client, Client as SupabaseClient
from app.config import settings

logger = logging.getLogger(__name__)


class VoiceCallService:
    """
    Twilio Voice API Service to initiate automated outbound phone calls
    and log call details into Supabase call_logs table.
    """

    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_phone = settings.TWILIO_PHONE_NUMBER
        self.webhook_base_url = settings.TWILIO_WEBHOOK_URL
        
        # Initialize Twilio REST Client
        try:
            self.twilio_client = TwilioClient(self.account_sid, self.auth_token)
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")
            self.twilio_client = None

        # Initialize Supabase Client
        try:
            self.supabase: SupabaseClient = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            self.supabase = None

    def place_call(
        self,
        phone_number: str,
        request_id: str,
        donor_id: str,
        blood_group: str,
        hospital_name: str,
        distance_km: float,
        retry_count: int = 0
    ) -> Dict[str, Any]:
        """
        Places an automated voice call to a donor using Twilio Voice API.
        
        Configures the TwiML Webhook URL to serve the interactive IVR prompt.
        Inserts an initial record into the Supabase call_logs table.
        """
        # Construct TwiML webhook endpoint URL with context parameters
        url_params = (
            f"request_id={request_id}"
            f"&donor_id={donor_id}"
            f"&blood_group={blood_group}"
            f"&hospital={hospital_name}"
            f"&distance={distance_km}"
        )
        voice_webhook_url = f"{self.webhook_base_url}/voice?{url_params}"
        status_callback_url = f"{self.webhook_base_url}/status?{url_params}"

        logger.info(f"Initiating call to {phone_number} for donor {donor_id}, request {request_id}")

        call_sid = f"CA_SIM_{uuid.uuid4().hex[:16]}"
        call_status = "initiated"
        error_msg = None

        if self.twilio_client and not settings.TWILIO_ACCOUNT_SID.startswith("AC_placeholder"):
            try:
                call = self.twilio_client.calls.create(
                    to=phone_number,
                    from_=self.from_phone,
                    url=voice_webhook_url,
                    status_callback=status_callback_url,
                    status_callback_event=['initiated', 'ringing', 'answered', 'completed'],
                    status_callback_method='POST',
                    method='POST',
                    timeout=20
                )
                call_sid = call.sid
                call_status = call.status or "initiated"
            except TwilioRestException as tre:
                logger.error(f"Twilio API Error when calling {phone_number}: {tre.msg} (Code: {tre.code})")
                call_status = "failed"
                error_msg = f"Twilio Error {tre.code}: {tre.msg}"
            except Exception as e:
                logger.error(f"Unexpected error placing call to {phone_number}: {e}")
                call_status = "failed"
                error_msg = str(e)
        else:
            logger.warning("Twilio credentials in demo mode. Simulated call initiated.")
            call_status = "initiated"

        # Log call details in Supabase call_logs table
        log_record = self.log_call(
            call_sid=call_sid,
            donor_id=donor_id,
            request_id=request_id,
            phone_number=phone_number,
            blood_group=blood_group,
            hospital_name=hospital_name,
            status=call_status,
            duration_seconds=0,
            dtmf_response="none",
            retry_count=retry_count,
            error_message=error_msg
        )

        return {
            "success": call_status != "failed",
            "call_sid": call_sid,
            "status": call_status,
            "log": log_record,
            "error": error_msg
        }

    def log_call(
        self,
        call_sid: str,
        donor_id: str,
        request_id: str,
        phone_number: str,
        blood_group: str,
        hospital_name: str,
        status: str,
        duration_seconds: int = 0,
        dtmf_response: str = "none",
        retry_count: int = 0,
        error_message: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates or updates a record in the Supabase `call_logs` table.
        """
        now_iso = datetime.now(timezone.utc).isoformat()
        data = {
            "call_sid": call_sid,
            "donor_id": donor_id,
            "request_id": request_id,
            "phone_number": phone_number,
            "blood_group": blood_group,
            "hospital_name": hospital_name,
            "status": status,
            "duration_seconds": duration_seconds,
            "dtmf_response": dtmf_response,
            "retry_count": retry_count,
            "error_message": error_message,
            "updated_at": now_iso
        }

        if self.supabase:
            try:
                # Upsert on call_sid conflict
                response = self.supabase.table("call_logs").upsert(
                    data,
                    on_conflict="call_sid"
                ).execute()
                logger.info(f"Logged call SID {call_sid} to Supabase with status '{status}'")
                return response.data[0] if response.data else data
            except Exception as e:
                logger.error(f"Failed to log call to Supabase: {e}")

        # Fallback return object for logging/monitoring
        data["created_at"] = now_iso
        return data

    def update_call_status(
        self,
        call_sid: str,
        status: str,
        duration_seconds: int = 0,
        dtmf_response: Optional[str] = None
    ) -> bool:
        """
        Updates an existing call log entry upon status callback or IVR gather event.
        """
        if not self.supabase:
            return False

        try:
            update_payload: Dict[str, Any] = {
                "status": status,
                "duration_seconds": duration_seconds,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            if dtmf_response is not None:
                update_payload["dtmf_response"] = dtmf_response

            self.supabase.table("call_logs").update(update_payload).eq("call_sid", call_sid).execute()
            return True
        except Exception as e:
            logger.error(f"Error updating call status for SID {call_sid}: {e}")
            return False


voice_call_service = VoiceCallService()
