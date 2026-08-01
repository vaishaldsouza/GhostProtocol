import logging
from typing import Optional, Dict, Any
from fastapi import FastAPI, Request, Response, BackgroundTasks, HTTPException, Header, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from twilio.request_validator import RequestValidator
from app.config import settings
from app.services.voice_call_service import voice_call_service
from app.services.ivr_handler import ivr_handler
from app.services.call_scheduler import call_scheduler
from app.routes.prediction_routes import router as prediction_router

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("redpulse.voice_api")

app = FastAPI(
    title=settings.APP_NAME,
    description="Automated Twilio Voice Calling API with TwiML IVR & Supabase integration for RedPulse AI",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Donor Prediction Engine Routes
app.include_router(prediction_router)
app.include_router(prediction_router, prefix="/api/v1")


# Twilio Webhook Security Middleware Helper
async def validate_twilio_signature(request: Request, x_twilio_signature: Optional[str] = Header(None)):
    """
    Validates Twilio X-Twilio-Signature HTTP header to ensure incoming webhooks
    genuinely originated from Twilio servers.
    """
    if settings.DEBUG and settings.TWILIO_AUTH_TOKEN.startswith("placeholder"):
        # Bypass signature check in development or demo mode
        return True

    if not x_twilio_signature:
        logger.warning("Missing X-Twilio-Signature header on webhook endpoint")
        raise HTTPException(status_code=403, detail="Missing Twilio Signature")

    validator = RequestValidator(settings.TWILIO_AUTH_TOKEN)
    url = str(request.url)
    form_data = await request.form()
    params = dict(form_data)

    if not validator.validate(url, params, x_twilio_signature):
        logger.error(f"Invalid Twilio Signature for URL: {url}")
        raise HTTPException(status_code=403, detail="Invalid Twilio Request Signature")

    return True


@app.get("/health")
def health_check():
    """Service health check endpoint."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "twilio_configured": not settings.TWILIO_ACCOUNT_SID.startswith("AC_placeholder")
    }


@app.post("/api/v1/emergency/dispatch-calls")
async def dispatch_emergency_calls(
    payload: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """
    Trigger automated voice calling cascade when a hospital creates an emergency blood request.
    Fetches top compatible donors from Supabase and initiates sequential voice calls.
    """
    request_id = payload.get("request_id")
    hospital_name = payload.get("hospital_name", "City General Hospital")
    blood_group = payload.get("blood_group", "O-")
    units = payload.get("units_needed", 2)

    if not request_id:
        raise HTTPException(status_code=400, detail="request_id is required")

    logger.info(f"Received emergency call dispatch trigger for request {request_id}")

    # Launch background async task
    background_tasks.add_task(
        call_scheduler.trigger_emergency_calling_cascade,
        request_id=request_id,
        hospital_name=hospital_name,
        blood_group=blood_group,
        units_required=units
    )

    return {
        "status": "queued",
        "message": "Automated Twilio Voice Calling cascade initiated successfully",
        "request_id": request_id,
        "blood_group": blood_group,
        "hospital": hospital_name
    }


@app.post("/api/v1/twilio/voice")
async def twilio_voice_webhook(
    request: Request,
    request_id: str = Query("req_default"),
    donor_id: str = Query("donor_default"),
    blood_group: str = Query("O-"),
    hospital: str = Query("City Hospital"),
    distance: float = Query(2.5),
    signature_valid: bool = Depends(validate_twilio_signature)
):
    """
    Twilio Webhook called when an automated outbound call is answered by the donor.
    Returns TwiML containing speech synthesis and <Gather> for DTMF key press.
    """
    logger.info(f"Twilio Voice Webhook connected for donor {donor_id}, request {request_id}")

    twiml_xml = ivr_handler.generate_initial_twiml(
        blood_group=blood_group,
        hospital=hospital,
        distance_km=distance,
        request_id=request_id,
        donor_id=donor_id
    )

    return Response(content=twiml_xml, media_type="application/xml")


@app.post("/api/v1/twilio/gather")
async def twilio_gather_webhook(
    request: Request,
    request_id: str = Query("req_default"),
    donor_id: str = Query("donor_default"),
    signature_valid: bool = Depends(validate_twilio_signature)
):
    """
    Twilio Webhook called when the donor presses a DTMF digit (1 = ACCEPT, 2 = DECLINE).
    Updates Supabase, updates real-time hospital dashboard, logs outcome, and returns TwiML.
    """
    form_data = await request.form()
    digits = str(form_data.get("Digits", ""))
    call_sid = str(form_data.get("CallSid", "CA_unknown"))

    logger.info(f"Twilio Gather Webhook received digit '{digits}' for Call SID {call_sid}")

    twiml_xml, result_meta = ivr_handler.process_dtmf_response(
        digits=digits,
        request_id=request_id,
        donor_id=donor_id,
        call_sid=call_sid
    )

    return Response(content=twiml_xml, media_type="application/xml")


@app.post("/api/v1/twilio/status")
async def twilio_status_callback(
    request: Request,
    signature_valid: bool = Depends(validate_twilio_signature)
):
    """
    Twilio Status Callback endpoint to log call duration, final status, and completion timestamps.
    """
    form_data = await request.form()
    call_sid = str(form_data.get("CallSid", ""))
    call_status = str(form_data.get("CallStatus", "completed"))
    duration = int(form_data.get("CallDuration", 0))

    logger.info(f"Twilio Call Status Callback: SID {call_sid} -> Status {call_status}, Duration {duration}s")

    if call_sid:
        voice_call_service.update_call_status(
            call_sid=call_sid,
            status=call_status,
            duration_seconds=duration
        )

    return {"status": "received", "call_sid": call_sid}


@app.get("/api/v1/call-logs")
def get_call_logs(
    request_id: Optional[str] = None,
    limit: int = 20
):
    """
    Retrieves recent call logs from Supabase for monitoring and auditing.
    """
    if voice_call_service.supabase:
        try:
            query = voice_call_service.supabase.table("call_logs").select("*").order("created_at", desc=True).limit(limit)
            if request_id:
                query = query.eq("request_id", request_id)
            res = query.execute()
            return {"call_logs": res.data or []}
        except Exception as e:
            logger.error(f"Error fetching call logs: {e}")

    return {"call_logs": [], "note": "Database connection unconfigured or offline."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
