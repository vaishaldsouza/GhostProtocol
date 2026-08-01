"""
FastAPI Routes for Intelligent Donor Prediction, Ranking Engine, and Response Handling.
"""

import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.models.blood_request import (
    PredictDonorsRequest,
    NotifyDonorsRequest,
    DonorResponseRequest
)
from app.services.prediction_service import prediction_service
from app.services.notification_service import notification_service

logger = logging.getLogger("redpulse.prediction_routes")

router = APIRouter(tags=["Donor Prediction Engine"])


@router.post("/predict-donors")
async def predict_and_rank_donors(payload: PredictDonorsRequest):
    """
    Predicts, scores, and ranks compatible donors for an emergency blood request.
    Applies weighted scoring formula:
      - 40% Distance
      - 20% Donation Eligibility / Recency
      - 20% Previous Acceptance Rate
      - 10% Availability
      - 10% Blood Match Priority
    """
    logger.info(f"Executing donor prediction for request {payload.request_id} ({payload.blood_group} at {payload.hospital_name})")

    try:
        ranked_donors = prediction_service.predict_and_rank_donors(payload)
        return {
            "status": "success",
            "request_id": payload.request_id,
            "hospital_name": payload.hospital_name,
            "required_blood_group": payload.blood_group,
            "units_needed": payload.units_needed,
            "urgency": payload.urgency,
            "total_donors_evaluated": len(ranked_donors),
            "ranked_donors": [d.dict() for d in ranked_donors]
        }
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction engine error: {str(e)}")


@router.post("/notify-donors")
async def notify_donors(
    payload: NotifyDonorsRequest,
    background_tasks: BackgroundTasks
):
    """
    Triggers smart notifications (WhatsApp, Email, Twilio Voice) based on urgency level:
      - Critical: Top 10 donors simultaneously
      - High: Top 5 donors
      - Normal: Top 3 donors
    """
    logger.info(f"Triggering smart notification strategy for request {payload.request_id}")

    # Fetch cached predictions or predict on the fly
    req = PredictDonorsRequest(
        request_id=payload.request_id,
        urgency=payload.urgency
    )
    ranked_donors = prediction_service.predict_and_rank_donors(req)

    if not ranked_donors:
        raise HTTPException(status_code=404, detail="No eligible compatible donors found for this request.")

    # Execute notifications
    dispatch_res = await notification_service.notify_donors_cascade(
        request_id=payload.request_id,
        ranked_donors=ranked_donors,
        urgency=payload.urgency,
        channels=payload.channels
    )

    return dispatch_res


@router.post("/accept-donation")
async def accept_donation(payload: DonorResponseRequest):
    """
    Donor accepts blood donation request.
    Marks donation_status = ACCEPTED, reserves donor, and updates real-time hospital dashboard.
    """
    logger.info(f"Received ACCEPT response from donor {payload.donor_id} for request {payload.request_id}")
    res = await prediction_service.accept_donation(
        request_id=payload.request_id,
        donor_id=payload.donor_id,
        channel=payload.channel
    )
    return res


@router.post("/decline-donation")
async def decline_donation(payload: DonorResponseRequest):
    """
    Donor declines blood donation request.
    Marks donation_status = DECLINED and automatically cascades notification to the next ranked donor.
    """
    logger.info(f"Received DECLINE response from donor {payload.donor_id} for request {payload.request_id}")
    res = await prediction_service.decline_donation(
        request_id=payload.request_id,
        donor_id=payload.donor_id,
        reason=payload.reason,
        channel=payload.channel
    )
    return res


@router.get("/prediction-history/{request_id}")
async def get_prediction_history(request_id: str):
    """
    Fetches prediction logs and historical donor score breakdowns for a blood request.
    """
    history = prediction_service.get_prediction_history(request_id)
    return history
